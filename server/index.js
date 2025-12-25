const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'alfred',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'alfred_db',
    password: process.env.DB_PASSWORD || 'alfred_password',
    port: 5432,
});

const SECRET_KEY = process.env.JWT_SECRET || 'alfred_super_secret_key';

// --- AUTH ROUTES ---

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        if (!user.active) {
            return res.status(403).json({ error: 'Conta suspensa' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        
        // Remove password from response
        delete user.password_hash;
        
        res.json({ token, user: {
            ...user,
            id: user.id.toString(), // Ensure ID is string for frontend compatibility
            modules: ['FINANCE', 'TASKS', 'LISTS', user.role === 'ADMIN' ? 'ADMIN' : null].filter(Boolean)
        }});

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone, subscription } = req.body;
    try {
        // Hash Password (default for new users if not provided is 123456, but frontend should provide it)
        const pass = password || '123456'; 
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pass, salt);

        // Calculate Trial
        let trialDays = 15;
        // Logic to fetch plan details could go here
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone, subscription, trial_ends_at) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, email, hash, phone, subscription, trialEndsAt]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        
        delete user.password_hash;

        res.json({ token, user: {
            ...user,
            id: user.id.toString(),
            modules: ['FINANCE', 'TASKS', 'LISTS']
        }});

    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

// --- DATA ROUTES (Protected) ---

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

app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const tasks = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
        const transactions = await pool.query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
        // Lists structure is complex, simplified for this example
        
        res.json({
            tasks: tasks.rows.map(t => ({...t, id: t.id.toString(), date: t.date.toISOString().split('T')[0]})),
            transactions: transactions.rows.map(t => ({...t, id: t.id.toString()}))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Alfred Backend running on port ${port}`);
});
