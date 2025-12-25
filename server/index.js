const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const pool = new Pool({
    user: process.env.DB_USER || 'alfred',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alfred_db',
    password: process.env.DB_PASSWORD || 'alfred_password',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET || 'alfred_super_secret_key';

// --- AUTO-SETUP DB ---
const initDB = async () => {
    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        
        // Tabelas Base
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), phone VARCHAR(50), role VARCHAR(20) DEFAULT 'USER', subscription VARCHAR(50) DEFAULT 'MONTHLY', trial_ends_at TIMESTAMP, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS system_configs (key VARCHAR(50) PRIMARY KEY, value JSONB)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS list_groups (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), name VARCHAR(255))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS list_items (id SERIAL PRIMARY KEY, list_id INTEGER REFERENCES list_groups(id) ON DELETE CASCADE, name VARCHAR(255), status VARCHAR(50) DEFAULT 'PENDING', category VARCHAR(100))`);
        
        // Tabelas com Recorrência
        await pool.query(`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR(255), date DATE, time TIME, status VARCHAR(50), priority VARCHAR(20), notified BOOLEAN DEFAULT FALSE)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), description VARCHAR(255), amount DECIMAL(10, 2), type VARCHAR(20), category VARCHAR(100), date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        // Novas Tabelas Admin
        await pool.query(`CREATE TABLE IF NOT EXISTS plans (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), price DECIMAL(10,2), trial_days INTEGER, active BOOLEAN DEFAULT TRUE)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS coupons (id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE, type VARCHAR(20), value DECIMAL(10,2), applies_to JSONB, active BOOLEAN DEFAULT TRUE)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS tutorials (id SERIAL PRIMARY KEY, title VARCHAR(255), description TEXT, video_url VARCHAR(255))`);

        // Migrações (Adicionar colunas se não existirem)
        try { await pool.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT 'NONE'`); } catch(e) {}
        try { await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) DEFAULT 'NONE'`); } catch(e) {}
        try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT FALSE`); } catch(e) {}

        // Seed Admin & Planos
        const adminEmail = 'maisalem.md@gmail.com';
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        if (userCheck.rows.length === 0) {
            const hash = await bcrypt.hash('Alfred@1992', 10);
            await pool.query("INSERT INTO users (name, email, password_hash, role, subscription) VALUES ($1, $2, $3, 'ADMIN', 'ANNUAL')", ['Alfred Admin', adminEmail, hash]);
        }

        // Seed Default Plans
        const plansCheck = await pool.query('SELECT * FROM plans');
        if (plansCheck.rows.length === 0) {
            await pool.query("INSERT INTO plans (id, name, price, trial_days) VALUES ('MONTHLY', 'Mensal', 29.90, 7), ('SEMIANNUAL', 'Semestral', 149.90, 14), ('ANNUAL', 'Anual', 299.90, 30)");
        }

    } catch (e) {
        console.error('DB Init Error:', e);
    }
};
initDB();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });
        if (!user.active && user.role !== 'ADMIN') return res.status(403).json({ error: 'Conta suspensa. Contate o suporte.' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        delete user.password_hash;
        res.json({ token, user: { ...user, id: user.id.toString() } });
    } catch (err) { res.status(500).json({ error: 'Erro no login' }); }
});

// --- DASHBOARD DATA ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY date ASC', [userId]);
        const transactions = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        const config = await pool.query('SELECT value FROM system_configs WHERE key = $1', ['general_config']);
        
        const listsQuery = await pool.query('SELECT * FROM list_groups WHERE user_id = $1 ORDER BY id DESC', [userId]);
        const lists = listsQuery.rows;
        for (let list of lists) {
            const itemsQuery = await pool.query('SELECT * FROM list_items WHERE list_id = $1 ORDER BY id ASC', [list.id]);
            list.items = itemsQuery.rows;
        }

        let adminData = {};
        if (req.user.role === 'ADMIN') {
            const users = await pool.query('SELECT id, name, email, role, active, subscription, trial_ends_at, is_test_user, created_at FROM users ORDER BY id DESC');
            const plans = await pool.query('SELECT * FROM plans');
            const coupons = await pool.query('SELECT * FROM coupons');
            const tutorials = await pool.query('SELECT * FROM tutorials');
            adminData = { users: users.rows, plans: plans.rows, coupons: coupons.rows, tutorials: tutorials.rows };
        } else {
             // User data (Tutorials, etc)
             const tutorials = await pool.query('SELECT * FROM tutorials');
             adminData = { tutorials: tutorials.rows };
        }

        res.json({
            tasks: tasks.rows,
            transactions: transactions.rows,
            lists: lists,
            config: config.rows[0]?.value || {},
            ...adminData
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados' }); 
    }
});

// --- TRANSACTIONS ---
app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { description, amount, type, category, recurrence } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (user_id, description, amount, type, category, recurrence) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, description, amount, type, category, recurrence || 'NONE']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro' }); }
});
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]); res.json({success:true}); } catch (e) { res.sendStatus(500); }
});

// --- TASKS ---
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, date, time, priority, recurrence } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, title, date, time, priority, status, recurrence) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [req.user.id, title, date, time || null, priority, 'PENDING', recurrence || 'NONE']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro' }); }
});
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
    const updates = req.body; // status, priority, title, etc
    const fields = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(updates);
    
    try { 
        if (fields.length > 0) {
            await pool.query(`UPDATE tasks SET ${fields} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`, [...values, req.params.id, req.user.id]); 
        }
        res.json({success:true}); 
    } catch (e) { res.sendStatus(500); }
});

// --- LISTS & ITEMS (Omitted for brevity, kept same logic) ---
app.post('/api/lists', authenticateToken, async (req, res) => {
    try { const r = await pool.query('INSERT INTO list_groups (user_id, name) VALUES ($1, $2) RETURNING *', [req.user.id, req.body.name]); res.json({...r.rows[0], items:[]}); } catch(e) { res.sendStatus(500); }
});
app.post('/api/lists/:id/items', authenticateToken, async (req, res) => {
    try { const r = await pool.query('INSERT INTO list_items (list_id, name) VALUES ($1, $2) RETURNING *', [req.params.id, req.body.name]); res.json(r.rows[0]); } catch(e) { res.sendStatus(500); }
});
app.patch('/api/lists/items/:id', authenticateToken, async (req, res) => {
    try { await pool.query('UPDATE list_items SET status = $1 WHERE id = $2', [req.body.status, req.params.id]); res.json({success:true}); } catch(e) { res.sendStatus(500); }
});
app.delete('/api/lists/items/:id', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM list_items WHERE id = $1', [req.params.id]); res.json({success:true}); } catch(e) { res.sendStatus(500); }
});

// --- USER PROFILE & CONFIG ---
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET name=$1, email=$2, phone=$3, password_hash=$4 WHERE id=$5', [name, email, phone, hash, req.user.id]);
        } else {
            await pool.query('UPDATE users SET name=$1, email=$2, phone=$3 WHERE id=$4', [name, email, phone, req.user.id]);
        }
        res.json({ success: true });
    } catch (e) { res.sendStatus(500); }
});

// --- ADMIN ENDPOINTS ---
app.post('/api/admin/config', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try { await pool.query('INSERT INTO system_configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['general_config', req.body]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { name, email, password, subscription, isTestUser } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        // Se for user teste, trial_ends_at = 2099
        const trialEnd = isTestUser ? new Date('2099-12-31') : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, subscription, is_test_user, trial_ends_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, hash, subscription || 'MONTHLY', isTestUser || false, trialEnd]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { active, trialDaysToAdd, password } = req.body;
    try {
        if (active !== undefined) {
            await pool.query('UPDATE users SET active = $1 WHERE id = $2', [active, req.params.id]);
        }
        if (trialDaysToAdd) {
            await pool.query("UPDATE users SET trial_ends_at = trial_ends_at + interval '1 day' * $1 WHERE id = $2", [trialDaysToAdd, req.params.id]);
        }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
        }
        res.json({success: true});
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/admin/plans', authenticateToken, async (req, res) => {
    // Upsert Plan (id, price, trial_days)
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { id, price, trialDays } = req.body;
    try {
        await pool.query('INSERT INTO plans (id, price, trial_days) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET price = $2, trial_days = $3', [id, price, trialDays]);
        res.json({success: true});
    } catch (e) { res.sendStatus(500); }
});

app.post('/api/admin/coupons', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { code, type, value, appliesTo } = req.body;
    try {
        const result = await pool.query('INSERT INTO coupons (code, type, value, applies_to) VALUES ($1, $2, $3, $4) RETURNING *', [code, type, value, JSON.stringify(appliesTo)]);
        res.json(result.rows[0]);
    } catch (e) { res.sendStatus(500); }
});

app.post('/api/admin/tutorials', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { title, description, videoUrl } = req.body;
    try {
        const result = await pool.query('INSERT INTO tutorials (title, description, video_url) VALUES ($1, $2, $3) RETURNING *', [title, description, videoUrl]);
        res.json(result.rows[0]);
    } catch (e) { res.sendStatus(500); }
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../dist/index.html')); });

app.listen(port, '0.0.0.0', () => console.log(`Alfred Backend running on port ${port}`));