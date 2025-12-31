#!/bin/bash

# ==========================================
# ALFRED SAAS - AUTO INSTALLER (UBUNTU 22.04)
# ==========================================

set -e # Para o script se houver erro

# Cores para logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}>>> Iniciando Instalação do Ecossistema Alfred...${NC}"

# 1. Atualizar Sistema
echo -e "${GREEN}[1/8] Atualizando pacotes do sistema...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# 2. Instalar Node.js 20 (LTS)
echo -e "${GREEN}[2/8] Instalando Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PostgreSQL 15
echo -e "${GREEN}[3/8] Instalando PostgreSQL...${NC}"
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib

# 4. Configurar Banco de Dados
echo -e "${GREEN}[4/8] Configurando Banco de Dados Alfred...${NC}"
# Altere a senha abaixo se desejar algo diferente de 'alfred_db_pass'
sudo -u postgres psql -c "CREATE USER alfred_user WITH PASSWORD 'alfred_db_pass';" || true
sudo -u postgres psql -c "CREATE DATABASE alfred_db OWNER alfred_user;" || true
sudo -u postgres psql -c "ALTER USER alfred_user CREATEDB;"

# 5. Instalar PM2 (Gerenciador de Processos)
echo -e "${GREEN}[5/8] Instalando PM2...${NC}"
sudo npm install -g pm2

# 6. Setup do Projeto
echo -e "${GREEN}[6/8] Instalando dependências do projeto...${NC}"
# Entra na pasta atual onde o script está rodando
npm install
cd server
npm install
cd ..

# 7. Criar Variáveis de Ambiente (.env) se não existir
if [ ! -f server/.env ]; then
    echo -e "${GREEN}[7/8] Criando arquivo .env padrão...${NC}"
    cat > server/.env << EOL
PORT=3000
DB_HOST=localhost
DB_USER=alfred_user
DB_PASSWORD=alfred_db_pass
DB_NAME=alfred_db
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
# Adicione suas chaves de IA aqui depois
GEMINI_API_KEY=
EOL
fi

# 8. Build do Frontend
echo -e "${GREEN}[8/8] Compilando Frontend (React)...${NC}"
npm run build

echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Para iniciar o servidor:"
echo -e "1. Navegue para a pasta server: cd server"
echo -e "2. Execute as migrações (automático no start)"
echo -e "3. Inicie com PM2: pm2 start index.js --name alfred-api"
echo -e "4. Configure o Nginx para apontar para a porta 3000 (Opcional)"
echo -e "${BLUE}=========================================${NC}"
