
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DE BANCO DE DADOS ---
// Usa estritamente as variáveis de ambiente fornecidas
const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, 
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);
const SECRET_KEY = process.env.JWT_SECRET || 'alfred-default-secret';

// --- DATABASE MIGRATIONS E INICIALIZAÇÃO ---
const runMigrations = async () => {
    let client;
    try {
        console.log(`🔄 Conectando ao banco '${process.env.DB_NAME}' em '${process.env.DB_HOST}'...`);
        client = await pool.connect();
        
        await client.query('BEGIN');

        // Tabelas Básicas
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                balance NUMERIC DEFAULT 0,
                color VARCHAR(7)
            );
        `);

        // Tabela Transactions
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                amount NUMERIC NOT NULL,
                type VARCHAR(50) NOT NULL,
                category VARCHAR(100),
                date TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Migration para adicionar colunas de recorrência se não existirem
        await client.query(`
            DO $$ 
            BEGIN 
                BEGIN
                    ALTER TABLE transactions ADD COLUMN recurrence_period VARCHAR(20) DEFAULT 'NONE';
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE transactions ADD COLUMN recurrence_interval INTEGER DEFAULT 1;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE transactions ADD COLUMN recurrence_limit INTEGER DEFAULT 0;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
            END $$;
        `);

        // Tabela Investments
        await client.query(`
            CREATE TABLE IF NOT EXISTS investments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                amount NUMERIC NOT NULL,
                yield_rate NUMERIC DEFAULT 0,
                redemption_terms VARCHAR(255),
                start_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Tabelas de Metas (Goals)
        await client.query(`
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                target_amount NUMERIC NOT NULL,
                current_amount NUMERIC DEFAULT 0,
                deadline DATE
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS goal_entries (
                id SERIAL PRIMARY KEY,
                goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
                amount NUMERIC NOT NULL,
                date TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Tabela de Tarefas (Tasks)
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                due_date DATE,
                priority VARCHAR(20) DEFAULT 'MEDIUM',
                recurrence VARCHAR(20) DEFAULT 'NONE',
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // Tabelas de Listas
        await client.query(`
            CREATE TABLE IF NOT EXISTS lists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) DEFAULT 'SUPPLIES',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS list_items (
                id SERIAL PRIMARY KEY,
                list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER DEFAULT 1,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        // Seed Admin User
        const adminEmail = 'admin@alfred.local';
        const adminRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('alfred@1992', 10);
            const userInsert = await client.query(`
                INSERT INTO users (name, email, password_hash) 
                VALUES ('Admin User', $1, $2) RETURNING id`, [adminEmail, hashedPassword]);
            
            // Create Default Account for transactions without account_id
            await client.query(`
                INSERT INTO accounts (user_id, name, type, balance, color)
                VALUES ($1, 'Carteira Principal', 'WALLET', 0, '#f59e0b')
            `, [userInsert.rows[0].id]);
            
            console.log("👤 Usuário Admin inicial criado com Carteira Principal.");
        }

        await client.query('COMMIT');
        console.log("🚀 Sistema Alfred :: Banco de Dados Sincronizado.");
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error("❌ Erro no Banco:", e.message);
    } finally {
        if (client) client.release();
    }
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        
        const user = result.rows[0];
        if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Senha incorreta.' });
        
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

// Dashboard Data (Aggregated)
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        const accountsRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        const transactionsRes = await pool.query(`
            SELECT 
                id, description, amount, type, category, date, account_id,
                recurrence_period as "recurrencePeriod",
                recurrence_interval as "recurrenceInterval",
                recurrence_limit as "recurrenceLimit"
            FROM transactions 
            WHERE user_id = $1 
            ORDER BY date DESC
        `, [userId]);
        
        const investmentsRes = await pool.query(`
            SELECT 
                id, name, type, amount, 
                yield_rate as "yieldRate", 
                redemption_terms as "redemptionTerms",
                start_date as "startDate"
            FROM investments
            WHERE user_id = $1
            ORDER BY start_date DESC
        `, [userId]);

        const goalsRes = await pool.query(`
            SELECT 
                id, name, target_amount as "targetAmount", current_amount as "currentAmount", deadline
            FROM goals
            WHERE user_id = $1
            ORDER BY deadline ASC
        `, [userId]);

        const tasksRes = await pool.query(`
            SELECT
                id, description, due_date as "dueDate", priority, recurrence, is_completed as "isCompleted"
            FROM tasks
            WHERE user_id = $1
            ORDER BY is_completed ASC, due_date ASC
        `, [userId]);

        // Fetch Lists and Items
        const listsRes = await pool.query(`SELECT id, name, type FROM lists WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        const lists = listsRes.rows;
        
        // Populate items for each list
        for (let list of lists) {
            const itemsRes = await pool.query(`
                SELECT id, list_id as "listId", name, quantity, is_completed as "isCompleted" 
                FROM list_items WHERE list_id = $1 ORDER BY is_completed ASC, created_at DESC
            `, [list.id]);
            list.items = itemsRes.rows;
        }
        
        res.json({
            user: userRes.rows[0],
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
            investments: investmentsRes.rows,
            goals: goalsRes.rows,
            tasks: tasksRes.rows,
            lists: lists
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

// --- TRANSACTION CRUD ---
app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { description, amount, type, category, date, accountId, recurrencePeriod, recurrenceInterval, recurrenceLimit } = req.body;
    try {
        // Ensure accountId is null if empty string
        const safeAccountId = (accountId && accountId !== "") ? accountId : null;
        
        await pool.query(
            `INSERT INTO transactions (user_id, description, amount, type, category, date, account_id, recurrence_period, recurrence_interval, recurrence_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [req.user.id, description, amount, type, category, date, safeAccountId, recurrencePeriod, recurrenceInterval, recurrenceLimit]
        );
        res.status(201).json({ message: 'Criado com sucesso' });
    } catch (e) {
        console.error("Erro insert transação:", e);
        res.status(500).json({ error: 'Erro ao salvar transação: ' + e.message });
    }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { description, amount, type, category, date, accountId, recurrencePeriod, recurrenceInterval, recurrenceLimit } = req.body;
    try {
        const safeAccountId = (accountId && accountId !== "") ? accountId : null;

        await pool.query(
            `UPDATE transactions SET description=$1, amount=$2, type=$3, category=$4, date=$5, account_id=$6, recurrence_period=$7, recurrence_interval=$8, recurrence_limit=$9
             WHERE id=$10 AND user_id=$11`,
            [description, amount, type, category, date, safeAccountId, recurrencePeriod, recurrenceInterval, recurrenceLimit, id, req.user.id]
        );
        res.json({ message: 'Atualizado com sucesso' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Deletado com sucesso' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar' });
    }
});

// --- INVESTMENT CRUD ---
app.post('/api/investments', authenticateToken, async (req, res) => {
    const { name, type, amount, yieldRate, redemptionTerms, startDate } = req.body;
    try {
        await pool.query(
            `INSERT INTO investments (user_id, name, type, amount, yield_rate, redemption_terms, start_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [req.user.id, name, type, amount, yieldRate, redemptionTerms, startDate]
        );
        res.status(201).json({ message: 'Investimento criado' });
    } catch (e) {
        console.error("Erro insert investimento:", e);
        res.status(500).json({ error: 'Erro ao salvar investimento: ' + e.message });
    }
});

app.put('/api/investments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, type, amount, yieldRate, redemptionTerms, startDate } = req.body;
    try {
        await pool.query(
            `UPDATE investments SET name=$1, type=$2, amount=$3, yield_rate=$4, redemption_terms=$5, start_date=$6
             WHERE id=$7 AND user_id=$8`,
            [name, type, amount, yieldRate, redemptionTerms, startDate, id, req.user.id]
        );
        res.json({ message: 'Investimento atualizado' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar investimento' });
    }
});

app.delete('/api/investments/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Investimento removido' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar investimento' });
    }
});

// --- GOALS CRUD ---
app.post('/api/goals', authenticateToken, async (req, res) => {
    const { name, targetAmount, deadline } = req.body;
    try {
        await pool.query(
            `INSERT INTO goals (user_id, name, target_amount, deadline) VALUES ($1, $2, $3, $4)`,
            [req.user.id, name, targetAmount, deadline]
        );
        res.status(201).json({ message: 'Meta criada' });
    } catch (e) {
        console.error("Erro insert meta:", e);
        res.status(500).json({ error: 'Erro ao criar meta: ' + e.message });
    }
});

app.post('/api/goals/:id/entry', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body; // Positive to add, negative to remove
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Update current amount
        await client.query(`
            UPDATE goals SET current_amount = current_amount + $1 
            WHERE id = $2 AND user_id = $3
        `, [amount, id, req.user.id]);

        // Log entry
        await client.query(`
            INSERT INTO goal_entries (goal_id, amount) VALUES ($1, $2)
        `, [id, amount]);

        await client.query('COMMIT');
        res.json({ message: 'Saldo atualizado' });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Erro ao atualizar saldo da meta' });
    } finally {
        client.release();
    }
});

app.get('/api/goals/:id/entries', authenticateToken, async (req, res) => {
    try {
        // Verifica propriedade
        const goalCheck = await pool.query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (goalCheck.rowCount === 0) return res.status(403).json({ error: 'Acesso negado' });

        const entries = await pool.query(`SELECT * FROM goal_entries WHERE goal_id = $1 ORDER BY date DESC`, [req.params.id]);
        res.json(entries.rows);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Meta removida' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar meta' });
    }
});

// --- TASKS CRUD ---
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { description, dueDate, priority, recurrence } = req.body;
    try {
        await pool.query(
            `INSERT INTO tasks (user_id, description, due_date, priority, recurrence)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, description, dueDate, priority, recurrence]
        );
        res.status(201).json({ message: 'Tarefa criada' });
    } catch (e) {
        console.error("Erro insert tarefa:", e);
        res.status(500).json({ error: 'Erro ao salvar tarefa: ' + e.message });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { description, dueDate, priority, recurrence } = req.body;
    try {
        await pool.query(
            `UPDATE tasks SET description=$1, due_date=$2, priority=$3, recurrence=$4
             WHERE id=$5 AND user_id=$6`,
            [description, dueDate, priority, recurrence, id, req.user.id]
        );
        res.json({ message: 'Tarefa atualizada' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
});

app.patch('/api/tasks/:id/toggle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            `UPDATE tasks SET is_completed = NOT is_completed WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );
        res.json({ message: 'Status alterado' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao alterar status' });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Tarefa removida' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar tarefa' });
    }
});

// --- LISTS CRUD ---
app.post('/api/lists', authenticateToken, async (req, res) => {
    const { name, type } = req.body;
    try {
        await pool.query(
            `INSERT INTO lists (user_id, name, type) VALUES ($1, $2, $3)`,
            [req.user.id, name, type]
        );
        res.status(201).json({ message: 'Lista criada' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao criar lista' });
    }
});

app.delete('/api/lists/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM lists WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ message: 'Lista removida' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar lista' });
    }
});

app.post('/api/lists/:id/items', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, quantity } = req.body;
    try {
        // Verifica propriedade da lista
        const listCheck = await pool.query('SELECT id FROM lists WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (listCheck.rowCount === 0) return res.status(403).json({ error: 'Acesso negado' });

        await pool.query(
            `INSERT INTO list_items (list_id, name, quantity) VALUES ($1, $2, $3)`,
            [id, name, quantity]
        );
        res.status(201).json({ message: 'Item adicionado' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao adicionar item' });
    }
});

app.patch('/api/items/:id/toggle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Verifica propriedade via join
        const itemCheck = await pool.query(`
            SELECT li.id FROM list_items li 
            JOIN lists l ON li.list_id = l.id 
            WHERE li.id = $1 AND l.user_id = $2
        `, [id, req.user.id]);
        
        if (itemCheck.rowCount === 0) return res.status(403).json({ error: 'Acesso negado' });

        await pool.query(
            `UPDATE list_items SET is_completed = NOT is_completed WHERE id = $1`,
            [id]
        );
        res.json({ message: 'Status do item alterado' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao alterar status do item' });
    }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
    try {
         // Verifica propriedade via join
         const itemCheck = await pool.query(`
            SELECT li.id FROM list_items li 
            JOIN lists l ON li.list_id = l.id 
            WHERE li.id = $1 AND l.user_id = $2
        `, [req.params.id, req.user.id]);
        
        if (itemCheck.rowCount === 0) return res.status(403).json({ error: 'Acesso negado' });

        await pool.query('DELETE FROM list_items WHERE id = $1', [req.params.id]);
        res.json({ message: 'Item removido' });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao deletar item' });
    }
});

const startServer = async () => {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`\n🤖 Alfred Backend ouvindo na porta ${PORT}`));
};

startServer();
