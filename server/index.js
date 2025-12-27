
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
// Tenta carregar o .env do diretório atual
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DE BANCO ---
let pool;
// Se não houver DATABASE_URL no .env, usamos um fallback, mas avisamos.
if (!process.env.DATABASE_URL) {
    console.warn('⚠️  AVISO: DATABASE_URL não encontrada no arquivo .env.');
    console.warn('⚠️  Tentando conexão padrão: postgres://postgres:postgres@localhost:5432/alfred');
    pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/alfred' });
} else {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
}

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key-for-alfred-ia';

// --- DATABASE MIGRATIONS E INICIALIZAÇÃO ---
const runMigrations = async () => {
    let client;
    try {
        console.log("🔄 Tentando conectar ao Banco de Dados...");
        client = await pool.connect();
        
        await client.query('BEGIN');
        console.log("✅ Conexão bem sucedida. Verificando tabelas...");

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
        
        // Seed Admin User
        const adminEmail = 'admin@alfred.local';
        const adminRes = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
        if (adminRes.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('alfred@1992', 10);
            await client.query(`
                INSERT INTO users (name, email, password_hash) 
                VALUES ('Admin User', $1, $2)`, [adminEmail, hashedPassword]);
            console.log("👤 Usuário Admin criado: admin@alfred.local / alfred@1992");
        }

        await client.query('COMMIT');
        console.log("🚀 Sistema Alfred pronto para operação.");
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        
        // TRATAMENTO DE ERROS ESPECÍFICOS PARA AJUDAR O USUÁRIO
        console.error("\n❌ ERRO CRÍTICO NO BANCO DE DADOS:");
        
        if (e.code === '28P01') {
            console.error("🔒 FALHA DE AUTENTICAÇÃO (Senha Incorreta)");
            console.error("A senha do usuário 'postgres' está incorreta.");
            console.error("👉 AÇÃO: Abra o arquivo 'server/.env' e coloque a senha correta do seu PostgreSQL em 'DATABASE_URL'.");
        } else if (e.code === '3D000') {
            console.error("🗄️ BANCO DE DADOS NÃO ENCONTRADO");
            console.error("O banco de dados 'alfred' não existe no seu PostgreSQL.");
            console.error("👉 AÇÃO: Abra seu terminal SQL ou PgAdmin e execute: CREATE DATABASE alfred;");
        } else if (e.code === 'ECONNREFUSED') {
            console.error("🔌 CONEXÃO RECUSADA");
            console.error("Não foi possível conectar na porta 5432.");
            console.error("👉 AÇÃO: Verifique se o PostgreSQL está rodando.");
        } else {
            console.error(e.message);
        }
        console.error("\n"); // Espaço extra
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
    res.json({ status: 'online', db: process.env.DATABASE_URL ? 'configured' : 'fallback' });
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
        res.status(500).json({ error: 'Erro de conexão com o banco de dados. Verifique o terminal do servidor.' });
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
