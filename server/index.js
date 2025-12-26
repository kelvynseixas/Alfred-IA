const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'alfred',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alfred_db',
    password: process.env.DB_PASSWORD || 'alfred_password',
    port: 5432,
});

const runMigrations = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Tabelas base...
        await client.query(`CREATE TABLE IF NOT EXISTS investments (id SERIAL PRIMARY KEY, user_id INTEGER, name VARCHAR(255), type VARCHAR(50), institution VARCHAR(255), initial_amount DECIMAL, current_amount DECIMAL, interest_rate VARCHAR(100), start_date DATE, due_date DATE, liquidity VARCHAR(50))`);
        await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS project_id INTEGER`);
        await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence_period VARCHAR(50) DEFAULT 'NONE'`);
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
    }
};
runMigrations();

// TRANSACTION POST WITH PROJECT LOGIC
app.post('/api/transactions', async (req, res) => {
    const { user_id, description, amount, type, category, date, account_id, project_id, recurrence_period } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`INSERT INTO transactions (user_id, description, amount, type, category, date, account_id, project_id, recurrence_period) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
            [user_id, description, amount, type, category, date, account_id, project_id, recurrence_period]);
        
        // Se for RESERVE, atualizar o projeto
        if (type === 'RESERVE' && project_id) {
            await client.query(`UPDATE financial_projects SET current_amount = current_amount + $1 WHERE id = $2`, [amount, project_id]);
        }

        // Atualizar saldo da conta
        const multiplier = (type === 'INCOME') ? 1 : -1;
        await client.query(`UPDATE accounts SET balance = balance + $1 WHERE id = $2`, [amount * multiplier, account_id]);

        await client.query('COMMIT');
        res.json({success: true});
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({error: e.message});
    } finally {
        client.release();
    }
});

app.listen(3000, () => console.log('Alfred API on 3000'));