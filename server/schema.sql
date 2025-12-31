-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. CRIAÇÃO DE TABELAS (Estrutura Base)
-- ==============================================================================

-- Tabela de Planos (SaaS)
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    period VARCHAR(20) NOT NULL, -- 'MONTHLY', 'YEARLY', 'LIFETIME'
    features TEXT[], -- Array de strings com as features
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Pode ser null se criado via social login futuro
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER', -- 'USER', 'ADMIN'
    plan_id INTEGER REFERENCES plans(id),
    plan_status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'OVERDUE', 'CANCELLED'
    plan_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contas (Carteiras/Bancos)
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'WALLET', 'BANK', 'INVESTMENT'
    balance NUMERIC(15, 2) DEFAULT 0,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações Financeiras
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'INCOME', 'EXPENSE', 'INVESTMENT'
    category VARCHAR(50),
    date TIMESTAMP NOT NULL,
    recurrence_period VARCHAR(20) DEFAULT 'NONE', -- 'NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_limit INTEGER, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investimentos
CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    yield_rate NUMERIC(5, 2), -- % de rendimento
    redemption_terms VARCHAR(100),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metas
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0,
    deadline TIMESTAMP
);

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    due_date TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    recurrence VARCHAR(20) DEFAULT 'NONE',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Listas de Compras/Desejos
CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'SUPPLIES', -- 'SUPPLIES', 'WISHES'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. AUTO-REPAIR (Adiciona colunas faltantes em tabelas antigas)
-- ==============================================================================

DO $$
BEGIN
    -- Fix: Adicionar password_hash se não existir na tabela users antiga
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT 'placeholder';
    END IF;

    -- Fix: Adicionar role se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';
    END IF;

    -- Fix: Adicionar plan_status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_status') THEN
        ALTER TABLE users ADD COLUMN plan_status VARCHAR(20) DEFAULT 'ACTIVE';
    END IF;

    -- Fix: Adicionar plan_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_id') THEN
        ALTER TABLE users ADD COLUMN plan_id INTEGER REFERENCES plans(id);
    END IF;
    
    -- Fix: Adicionar plan_expires_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_expires_at') THEN
        ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMP;
    END IF;
END $$;

-- ==============================================================================
-- 3. SEEDS (Dados Iniciais)
-- ==============================================================================

-- Inserir Planos Padrão (Se não existirem)
INSERT INTO plans (name, price, period, features) 
SELECT 'Plano Mensal', 37.00, 'MONTHLY', ARRAY['Acesso WhatsApp', 'Gestão Financeira', 'Suporte Básico']
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plano Mensal');

INSERT INTO plans (name, price, period, features) 
SELECT 'Plano Anual', 120.00, 'YEARLY', ARRAY['Tudo do Mensal', 'Desconto de 70%', 'Prioridade']
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plano Anual');

INSERT INTO plans (name, price, period, features) 
SELECT 'Plano Vitalício', 147.00, 'LIFETIME', ARRAY['Acesso Eterno', 'Atualizações Futuras', 'Suporte VIP']
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Plano Vitalício');

-- Inserir Usuário Admin Master 
-- A senha 'placeholder' será substituída pelo hash correto na inicialização do index.js
INSERT INTO users (name, email, password_hash, role, plan_status)
SELECT 'Admin Master', 'maisalem.md@gmail.com', 'placeholder', 'ADMIN', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'maisalem.md@gmail.com');
