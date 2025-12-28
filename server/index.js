
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
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, 
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

let poolConfig = dbConfig;
if (!process.env.DB_USER && process.env.DATABASE_URL) {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
}

const pool = new Pool(poolConfig);
const SECRET_KEY = process.env.JWT_SECRET || 'alfred-default-secret';

// --- DATABASE MIGRATIONS E INICIALIZAÇÃO ---
const runMigrations = async () => {
    let client;
    try {
        console.log(`🔄 Conectando ao banco '${process.env.DB_NAME || 'via URL'}'...`);
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

        // Tabela Investments (NOVA)
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
        
        // Seed Admin User
        const adminEmail = 'admin@alfred.local';
        const adminRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('alfred@1992', 10);
            await client.query(`
                INSERT INTO users (name, email, password_hash) 
                VALUES ('Admin User', $1, $2)`, [adminEmail, hashedPassword]);
            console.log("👤 Usuário Admin inicial criado.");
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
        
        res.json({
            user: userRes.rows[0],
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
            investments: investmentsRes.rows
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
        await pool.query(
            `INSERT INTO transactions (user_id, description, amount, type, category, date, account_id, recurrence_period, recurrence_interval, recurrence_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [req.user.id, description, amount, type, category, date, accountId || null, recurrencePeriod, recurrenceInterval, recurrenceLimit]
        );
        res.status(201).json({ message: 'Criado com sucesso' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao salvar transação' });
    }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { description, amount, type, category, date, accountId, recurrencePeriod, recurrenceInterval, recurrenceLimit } = req.body;
    try {
        await pool.query(
            `UPDATE transactions SET description=$1, amount=$2, type=$3, category=$4, date=$5, account_id=$6, recurrence_period=$7, recurrence_interval=$8, recurrence_limit=$9
             WHERE id=$10 AND user_id=$11`,
            [description, amount, type, category, date, accountId || null, recurrencePeriod, recurrenceInterval, recurrenceLimit, id, req.user.id]
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
        console.error(e);
        res.status(500).json({ error: 'Erro ao salvar investimento' });
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


const startServer = async () => {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`\n🤖 Alfred Backend ouvindo na porta ${PORT}`));
};

startServer();
