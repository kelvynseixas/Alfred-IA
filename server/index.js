
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DE BANCO DE DADOS ---
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, 
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const SECRET_KEY = process.env.JWT_SECRET || 'alfred-default-secret';

// Teste de Conexão ao iniciar
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERRO CRÍTICO DB: Não foi possível conectar.', err.message);
    } else {
        console.log('✅ Conexão DB estabelecida!');
        release();
    }
});

pool.on('error', (err, client) => {
    console.error('❌ Erro inesperado no cliente DB ocioso', err);
});

// --- MIGRATIONS AUTOMÁTICAS ---
const runMigrations = async () => {
    try {
        const client = await pool.connect();
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schemaSql);
            console.log("✅ Schema SQL verificado.");
            
            // CORREÇÃO: Força a atualização da senha do Admin Master SEMPRE que iniciar
            try {
                const defaultPass = 'alfred@1992';
                const hashedPassword = await bcrypt.hash(defaultPass, 10);
                
                await client.query(`
                    UPDATE users SET password_hash = $1 
                    WHERE email = 'maisalem.md@gmail.com'
                `, [hashedPassword]);
                console.log("🔐 Senha do Admin Master redefinida para: alfred@1992");
            } catch (errPass) {
                console.error("⚠️ Erro ao atualizar senha do admin:", errPass.message);
            }
        }
        client.release();
    } catch (e) {
        console.error("❌ Erro Fatal na Migration:", e.message);
    }
};

// --- MIDDLEWARES ---
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

const isAdmin = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length > 0 && result.rows[0].role === 'ADMIN') {
            next();
        } else {
            res.status(403).json({ error: 'Acesso restrito ao Admin Master.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Erro ao verificar permissões.' });
    }
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`\n🔑 Tentativa de Login: ${email}`);

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rowCount === 0) {
            console.log("❌ Usuário não encontrado.");
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        const user = result.rows[0];
        
        if (!user.password_hash) {
            console.error("❌ Usuário sem hash de senha.");
            return res.status(500).json({ error: 'Erro de cadastro. Contate suporte.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            console.log("❌ Senha incorreta.");
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        
        console.log(`✅ Login Sucesso: ${user.name}`);
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, role: user.role, name: user.name });

    } catch (e) {
        console.error("❌ Erro interno no Login:", e);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone, planId } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount > 0) return res.status(400).json({ error: 'Email já cadastrado.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        let planStatus = 'ACTIVE';
        let expiresAt = new Date();
        if (planId) {
             const planRes = await pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
             if (planRes.rowCount > 0) {
                const plan = planRes.rows[0];
                if (plan.period === 'MONTHLY') expiresAt.setMonth(expiresAt.getMonth() + 1);
                else if (plan.period === 'YEARLY') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                else if (plan.period === 'LIFETIME') expiresAt.setFullYear(expiresAt.getFullYear() + 99);
             }
        } else {
             expiresAt.setMonth(expiresAt.getMonth() + 1); 
        }

        const userRes = await pool.query(`
            INSERT INTO users (name, email, password_hash, phone, plan_id, plan_status, plan_expires_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `, [name, email, hashedPassword, phone, planId || null, planStatus, expiresAt]);

        const userId = userRes.rows[0].id;

        await pool.query(`INSERT INTO accounts (user_id, name, type, balance, color) VALUES ($1, 'Carteira Principal', 'WALLET', 0, '#f59e0b')`, [userId]);

        const token = jwt.sign({ id: userId, role: 'USER' }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    } catch (e) {
        console.error("Erro Registro:", e);
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

// SOLICITAR REDEFINIÇÃO
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`\n❓ Solicitação de redefinição: ${email}`);
    
    try {
        const result = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
        
        if (result.rowCount === 0) {
            // Retorna sucesso falso por segurança
            return res.json({ message: 'Se o email existir, enviamos o link.' });
        }

        const resetToken = jwt.sign({ id: result.rows[0].id, type: 'reset' }, SECRET_KEY, { expiresIn: '1h' });
        
        // GERA O LINK PARA O FRONTEND (Porta 5173 padrão do Vite)
        const resetLink = `http://localhost:5173/?resetToken=${resetToken}`;
        
        console.log("=========================================================");
        console.log("📧 [SIMULAÇÃO DE EMAIL] Para redefinir, clique no link abaixo:");
        console.log(resetLink);
        console.log("=========================================================");
        
        res.json({ message: 'Link enviado.' });

    } catch (e) {
        console.error("Erro forgot-password:", e);
        res.status(500).json({ error: 'Erro ao processar.' });
    }
});

// EFETIVAR REDEFINIÇÃO
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.type !== 'reset') return res.status(400).json({ error: 'Token inválido.' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.id]);
        
        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (e) {
        console.error("Erro reset-password:", e);
        res.status(400).json({ error: 'Link expirado ou inválido.' });
    }
});

app.get('/api/plans/public', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plans WHERE is_active = TRUE ORDER BY price ASC');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Erro ao buscar planos.' });
    }
});

// --- DASHBOARD ---
app.get('/api/data/dashboard', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const userRes = await pool.query(`
            SELECT u.id, u.name, u.email, u.phone, u.role, u.plan_status, u.plan_expires_at, p.name as plan_name 
            FROM users u LEFT JOIN plans p ON u.plan_id = p.id 
            WHERE u.id = $1
        `, [userId]);
        
        const accountsRes = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
        const transactionsRes = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 500', [userId]);
        const investmentsRes = await pool.query('SELECT * FROM investments WHERE user_id = $1 ORDER BY start_date DESC', [userId]);
        const goalsRes = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY deadline ASC', [userId]);
        const tasksRes = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC', [userId]);
        const notifRes = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]);
        
        const listsRes = await pool.query('SELECT * FROM lists WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        const lists = listsRes.rows;
        for (let list of lists) {
            const itemsRes = await pool.query('SELECT * FROM list_items WHERE list_id = $1 ORDER BY is_completed ASC, created_at DESC', [list.id]);
            list.items = itemsRes.rows;
        }
        
        res.json({
            user: userRes.rows[0],
            accounts: accountsRes.rows,
            transactions: transactionsRes.rows,
            investments: investmentsRes.rows,
            goals: goalsRes.rows,
            tasks: tasksRes.rows,
            notifications: notifRes.rows,
            lists: lists
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE role != \'ADMIN\'');
        const activePlans = await pool.query("SELECT COUNT(*) FROM users WHERE plan_status = 'ACTIVE'");
        const revenue = await pool.query(`SELECT SUM(p.price) as total FROM users u JOIN plans p ON u.plan_id = p.id WHERE u.plan_status = 'ACTIVE'`);
        const recentUsers = await pool.query('SELECT id, name, email, plan_status, created_at FROM users ORDER BY created_at DESC LIMIT 10');

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            activeSubscriptions: parseInt(activePlans.rows[0].count),
            monthlyRevenue: parseFloat(revenue.rows[0].total || 0),
            recentUsers: recentUsers.rows
        });
    } catch (e) { res.status(500).json({ error: 'Erro stats admin' }); }
});

app.get('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings');
        const settings = {};
        result.rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    } catch (e) { res.status(500).json({ error: 'Erro settings' }); }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, async (req, res) => {
    const updates = req.body; 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const [key, value] of Object.entries(updates)) {
            await client.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Configurações salvas' });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    } finally { client.release(); }
});

// --- TRANSAÇÕES ---
app.post('/api/transactions', authenticateToken, async (req, res) => {
    const { description, amount, type, category, date, accountId, recurrencePeriod, recurrenceInterval, recurrenceLimit } = req.body;
    try {
        await pool.query(
            `INSERT INTO transactions (user_id, description, amount, type, category, date, account_id, recurrence_period, recurrence_interval, recurrence_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [req.user.id, description, amount, type, category, date, accountId || null, recurrencePeriod, recurrenceInterval, recurrenceLimit]
        );
        res.status(201).json({ message: 'Salvo com sucesso' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM transactions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
        res.json({ message: 'Deletado' });
    } catch (e) { res.status(500).json({ error: 'Erro delete' }); }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { description, amount } = req.body; 
    try {
         await pool.query('UPDATE transactions SET description=$1, amount=$2 WHERE id=$3 AND user_id=$4', [description, amount, id, req.user.id]);
         res.json({ message: 'Atualizado' });
    } catch (e) { res.status(500).json({ error: 'Erro update' }); }
});

// Inicialização
const startServer = async () => {
    await runMigrations();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`\n🤖 Alfred SaaS Backend ouvindo na porta ${PORT}`));
};

startServer();
