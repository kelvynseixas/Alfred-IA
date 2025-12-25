const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração CORS e JSON
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React (pasta dist na raiz)
app.use(express.static(path.join(__dirname, '../dist')));

const pool = new Pool({
    user: process.env.DB_USER || 'alfred',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alfred_db',
    password: process.env.DB_PASSWORD || 'alfred_password',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET || 'alfred_super_secret_key';

// Middleware de Autenticação
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
        
        // Verifica a senha
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        delete user.password_hash;
        res.json({ token, user: { ...user, id: user.id.toString() } });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Erro no login' }); 
    }
});

// --- DATA DASHBOARD ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY date ASC', [userId]);
        const transactions = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        const config = await pool.query('SELECT value FROM system_configs WHERE key = $1', ['general_config']);
        
        res.json({
            tasks: tasks.rows,
            transactions: transactions.rows,
            config: config.rows[0]?.value || {}
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
    } catch (err) { res.status(500).json({ error: 'Erro ao salvar transação' }); }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao deletar' }); }
});

// --- TASKS ---
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, date, time, priority } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, title, date, time, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, title, date, time || null, priority]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao salvar tarefa' }); }
});

app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3', [status, req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao atualizar tarefa' }); }
});

// --- ADMIN CONFIG ---
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

// Rota Catch-all para servir o React Router (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, '0.0.0.0', () => console.log(`Alfred Backend running on port ${port}`));