
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
// Prioriza as variáveis individuais fornecidas, com fallback para DATABASE_URL
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, // Porta padrão do Postgres
    // Se estiver em produção (Render/Heroku), usa SSL
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Se não houver variáveis individuais, tenta usar a DATABASE_URL
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
        console.log(`🔄 Conectando ao banco '${process.env.DB_NAME || 'via URL'}' em '${process.env.DB_HOST || 'host'}'...`);
        client = await pool.connect();
        
        await client.query('BEGIN');
        console.log("✅ Conexão estabelecida com sucesso.");

        // Tabelas
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
        
        // Seed Admin User (Cria o usuário padrão se não existir)
        const adminEmail = 'admin@alfred.local';
        const adminRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('alfred@1992', 10);
            await client.query(`
                INSERT INTO users (name, email, password_hash) 
                VALUES ('Admin User', $1, $2)`, [adminEmail, hashedPassword]);
            console.log("👤 Usuário Admin inicial criado: admin@alfred.local / alfred@1992");
        }

        await client.query('COMMIT');
        console.log("🚀 Sistema Alfred :: Banco de Dados Sincronizado.");
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        
        console.error("\n❌ ERRO DE CONEXÃO COM O BANCO:");
        if (e.code === '28P01') {
            console.error(`🔒 Senha incorreta para o usuário '${process.env.DB_USER}'. Verifique o arquivo server/.env`);
        } else if (e.code === '3D000') {
            console.error(`🗄️ O banco de dados '${process.env.DB_NAME}' não existe.`);
            console.error("👉 DICA: Crie o banco manualmente com o comando: CREATE DATABASE alfred_db;");
        } else {
            console.error(e.message);
        }
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

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', db_host: process.env.DB_HOST });
});

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
            return res.status(401).json({ error: 'Senha incorreta.' });
        }
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) {
        console.error("Login Error:", e.message);
        res.status(500).json({ error: 'Erro interno no servidor.' });
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
        console.error("Dashboard Error:", e.message);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

// --- SERVER STARTUP ---
const startServer = async () => {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`\n🤖 Alfred Backend ouvindo na porta ${PORT}`));
};

startServer();
