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

// --- AUTO-SETUP DB (Previne erros de tabela inexistente) ---
const initDB = async () => {
    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), phone VARCHAR(50), role VARCHAR(20) DEFAULT 'USER', subscription VARCHAR(50) DEFAULT 'MONTHLY', trial_ends_at TIMESTAMP, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS system_configs (key VARCHAR(50) PRIMARY KEY, value JSONB)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR(255), date DATE, time TIME, status VARCHAR(50), priority VARCHAR(20), notified BOOLEAN DEFAULT FALSE)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), description VARCHAR(255), amount DECIMAL(10, 2), type VARCHAR(20), category VARCHAR(100), date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS list_groups (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), name VARCHAR(255))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS list_items (id SERIAL PRIMARY KEY, list_id INTEGER REFERENCES list_groups(id) ON DELETE CASCADE, name VARCHAR(255), status VARCHAR(50) DEFAULT 'PENDING', category VARCHAR(100))`);
        
        // Admin Seed
        const adminEmail = 'maisalem.md@gmail.com';
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        if (userCheck.rows.length === 0) {
            const hash = await bcrypt.hash('Alfred@1992', 10);
            await pool.query("INSERT INTO users (name, email, password_hash, role, subscription) VALUES ($1, $2, $3, 'ADMIN', 'ANNUAL')", ['Alfred Admin', adminEmail, hash]);
            console.log('Admin user created.');
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
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        delete user.password_hash;
        res.json({ token, user: { ...user, id: user.id.toString() } });
    } catch (err) { res.status(500).json({ error: 'Erro no login' }); }
});

// --- DASHBOARD DATA (Completo) ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY date ASC', [userId]);
        const transactions = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        const config = await pool.query('SELECT value FROM system_configs WHERE key = $1', ['general_config']);
        
        // Fetch Lists and Items
        const listsQuery = await pool.query('SELECT * FROM list_groups WHERE user_id = $1 ORDER BY id DESC', [userId]);
        const lists = listsQuery.rows;
        
        for (let list of lists) {
            const itemsQuery = await pool.query('SELECT * FROM list_items WHERE list_id = $1 ORDER BY id ASC', [list.id]);
            list.items = itemsQuery.rows;
        }

        // Fetch Users for Admin
        let users = [];
        if (req.user.role === 'ADMIN') {
            const usersQuery = await pool.query('SELECT id, name, email, role, active, subscription FROM users ORDER BY id DESC LIMIT 50');
            users = usersQuery.rows;
        }

        res.json({
            tasks: tasks.rows,
            transactions: transactions.rows,
            lists: lists,
            config: config.rows[0]?.value || {},
            users: users
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados' }); 
    }
});

// --- TRANSACTIONS ---
app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { description, amount, type, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO transactions (user_id, description, amount, type, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, description, amount, type, category]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro' }); }
});
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]); res.json({success:true}); } catch (e) { res.sendStatus(500); }
});

// --- TASKS ---
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, date, time, priority } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, title, date, time, priority, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, title, date, time || null, priority, 'PENDING']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro' }); }
});
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try { await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3', [status, req.params.id, req.user.id]); res.json({success:true}); } catch (e) { res.sendStatus(500); }
});

// --- LISTS ---
app.post('/api/lists', authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO list_groups (user_id, name) VALUES ($1, $2) RETURNING *', [req.user.id, name]);
        res.json({ ...result.rows[0], items: [] });
    } catch (e) { res.sendStatus(500); }
});
app.post('/api/lists/:id/items', authenticateToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query('INSERT INTO list_items (list_id, name, status) VALUES ($1, $2, $3) RETURNING *', [req.params.id, name, 'PENDING']);
        res.json(result.rows[0]);
    } catch (e) { res.sendStatus(500); }
});
app.patch('/api/lists/items/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try { await pool.query('UPDATE list_items SET status = $1 WHERE id = $2', [status, req.params.id]); res.json({success:true}); } catch (e) { res.sendStatus(500); }
});
app.delete('/api/lists/items/:id', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM list_items WHERE id = $1', [req.params.id]); res.json({success:true}); } catch (e) { res.sendStatus(500); }
});

// --- USER & ADMIN ---
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

app.post('/api/admin/config', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        await pool.query(
            'INSERT INTO system_configs (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            ['general_config', req.body]
        );
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar config' }); 
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`Alfred Backend running on port ${port}`));