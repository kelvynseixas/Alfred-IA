
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('FATAL ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-for-alfred-ia';

// --- DATABASE MIGRATIONS ---
const runMigrations = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log("Running Alfred IA migrations...");

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
        
        const adminEmail = 'admin@alfred.local';
        const adminRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('alfred@1992', 10);
            await client.query(`
                INSERT INTO users (name, email, password_hash) 
                VALUES ('Admin User', $1, $2)`, [adminEmail, hashedPassword]);
            console.log("Admin user created for Alfred IA.");
        }

        await client.query('COMMIT');
        console.log("Migrations completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
    }
};
runMigrations().catch(err => console.error('Failed to run migrations on startup:', err));

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

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Senha inválida.' });
        }
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- PROTECTED DATA ROUTE ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
        const accountsRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        const transactionsRes = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        
        res.json({
            user: userRes.rows[0],
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
        });
    } catch (e) {
        console.error("Dashboard data error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Alfred IA API running on port ${PORT}`));
