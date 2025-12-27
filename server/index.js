
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
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-for-alfred-ia';

// --- DATABASE MIGRATIONS ---
const runMigrations = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log("Running migrations...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'USER',
                subscription VARCHAR(50),
                plan_id VARCHAR(50),
                active BOOLEAN DEFAULT true,
                is_test_user BOOLEAN DEFAULT false,
                trial_ends_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        // Add other tables if they don't exist
        await client.query(`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(100), type VARCHAR(50), balance NUMERIC, color VARCHAR(7))`);
        await client.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, account_id INTEGER REFERENCES accounts(id), project_id INTEGER, description TEXT, amount NUMERIC, type VARCHAR(50), category VARCHAR(100), date TIMESTAMPTZ, recurrence_period VARCHAR(50), recurrence_interval INTEGER, recurrence_count INTEGER)`);
        await client.query(`CREATE TABLE IF NOT EXISTS financial_projects (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(255), description TEXT, target_amount NUMERIC, current_amount NUMERIC DEFAULT 0, deadline TIMESTAMPTZ, category VARCHAR(50), status VARCHAR(50) DEFAULT 'ACTIVE')`);
        await client.query(`CREATE TABLE IF NOT EXISTS investments (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(255), type VARCHAR(50), institution VARCHAR(255), initial_amount NUMERIC, current_amount NUMERIC, interest_rate VARCHAR(100), start_date DATE, due_date DATE, liquidity VARCHAR(50))`);
        await client.query(`CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(255), date TIMESTAMPTZ, time VARCHAR(10), status VARCHAR(50), priority VARCHAR(20), recurrence_period VARCHAR(50), recurrence_interval INTEGER, recurrence_count INTEGER)`);
        await client.query(`CREATE TABLE IF NOT EXISTS list_groups (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(255))`);
        await client.query(`CREATE TABLE IF NOT EXISTS list_items (id SERIAL PRIMARY KEY, list_group_id INTEGER REFERENCES list_groups(id) ON DELETE CASCADE, name VARCHAR(255), category VARCHAR(100), status VARCHAR(50))`);
        await client.query(`CREATE TABLE IF NOT EXISTS plans (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), type VARCHAR(50), price NUMERIC, trial_days INTEGER, active BOOLEAN)`);
        await client.query(`CREATE TABLE IF NOT EXISTS tutorials (id SERIAL PRIMARY KEY, title VARCHAR(255), description TEXT, video_url VARCHAR(255))`);
        await client.query(`CREATE TABLE IF NOT EXISTS announcements (id SERIAL PRIMARY KEY, title VARCHAR(255), message TEXT, date TIMESTAMPTZ DEFAULT NOW())`);
        await client.query(`CREATE TABLE IF NOT EXISTS system_configs (id INT PRIMARY KEY DEFAULT 1, config JSONB)`);

        // Check if admin user exists, if not create one
        const adminRes = await client.query("SELECT * FROM users WHERE email = 'maisalem.md@gmail.com'");
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('Alfred@1992', 10);
            await client.query(`
                INSERT INTO users (name, email, password_hash, role, is_test_user, subscription) 
                VALUES ('Admin', 'maisalem.md@gmail.com', $1, 'ADMIN', true, 'ANNUAL')`, [hashedPassword]);
            console.log("Admin user created.");
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
    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
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
            return res.status(400).json({ error: 'Usuário não encontrado.' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Senha inválida.' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- PROTECTED DATA ROUTE ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        const userRes = await pool.query('SELECT id, name, email, phone, avatar_url, role, subscription, plan_id, active, is_test_user, trial_ends_at FROM users WHERE id = $1', [userId]);
        const accountsRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        const transactionsRes = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        const projectsRes = await pool.query('SELECT * FROM financial_projects WHERE user_id = $1', [userId]);
        const investmentsRes = await pool.query('SELECT * FROM investments WHERE user_id = $1', [userId]);
        const tasksRes = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY date', [userId]);
        const listsRes = await pool.query('SELECT * FROM list_groups WHERE user_id = $1', [userId]);
        // Additional admin data
        const allUsersRes = userRole === 'ADMIN' ? await pool.query('SELECT id, name, email, role, subscription, active, is_test_user, trial_ends_at FROM users ORDER BY created_at DESC') : { rows: [] };
        const plansRes = await pool.query('SELECT * FROM plans');
        const tutorialsRes = await pool.query('SELECT * FROM tutorials');
        const announcementsRes = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
        const configRes = await pool.query('SELECT config FROM system_configs WHERE id = 1');

        res.json({
            user: userRes.rows[0],
            users: allUsersRes.rows,
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
            projects: projectsRes.rows,
            investments: investmentsRes.rows,
            tasks: tasksRes.rows,
            lists: listsRes.rows,
            plans: plansRes.rows,
            tutorials: tutorialsRes.rows,
            announcements: announcementsRes.rows,
            config: configRes.rows[0]?.config || {}
        });
    } catch (e) {
        console.error("Dashboard data error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- ADMIN ROUTES (Example) ---
app.post('/api/admin/config', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { config } = req.body;
    try {
        await pool.query(`
            INSERT INTO system_configs (id, config) VALUES (1, $1)
            ON CONFLICT (id) DO UPDATE SET config = $1
        `, [config]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Fallback for other routes, assuming they are protected
app.use('/api', authenticateToken, (req, res, next) => {
    // This is a placeholder for other API routes.
    // In a real app, each route would be defined like the dashboard route.
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Alfred API running on port ${PORT}`));
