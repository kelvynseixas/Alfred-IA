
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

        // Tabela Transactions (Criação inicial)
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

app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        const accountsRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        // Busca transações incluindo colunas de recorrência
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
        
        res.json({
            user: userRes.rows[0],
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

const startServer = async () => {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`\n🤖 Alfred Backend ouvindo na porta ${PORT}`));
};

startServer();
