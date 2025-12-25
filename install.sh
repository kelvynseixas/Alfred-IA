#!/bin/bash

# Verifica argumento do domínio
if [ -z "$1" ]; then
    echo "Uso: ./install.sh <dominio_ou_ip>"
    exit 1
fi

DOMAIN=$1

echo "--- Iniciando Instalação do Alfred IA em $DOMAIN ---"

# 1. Atualizar Sistema
echo "--- Atualizando Sistema ---"
sudo apt update && sudo apt upgrade -y

# 2. Instalar Dependências
echo "--- Instalando Dependências Base ---"
sudo apt install -y curl git nginx postgresql postgresql-contrib ufw build-essential

# 3. Instalar Node.js 20
echo "--- Instalando Node.js 20 ---"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Configurar PostgreSQL
echo "--- Configurando Banco de Dados ---"
sudo -u postgres psql -c "CREATE USER alfred WITH PASSWORD 'alfred_password';"
sudo -u postgres psql -c "CREATE DATABASE alfred_db OWNER alfred;"
sudo -u postgres psql -c "ALTER USER alfred WITH SUPERUSER;"

# Importar Schema
if [ -f "server/schema.sql" ]; then
    echo "Importando schema..."
    sudo -u postgres psql -d alfred_db -f server/schema.sql
else
    echo "ERRO: Arquivo server/schema.sql não encontrado!"
    exit 1
fi

# 5. Configurar Backend
echo "--- Configurando Backend ---"
cd server
npm install
sudo npm install -g pm2

# Criar .env
cat > .env << EOL
PORT=3000
DB_USER=alfred
DB_HOST=localhost
DB_NAME=alfred_db
DB_PASSWORD=alfred_password
JWT_SECRET=alfred_secret_key_production_change_me
EOL

# Iniciar com PM2
pm2 delete alfred-api 2>/dev/null || true
pm2 start index.js --name "alfred-api"
pm2 save
pm2 startup
cd ..

# 6. Configurar Frontend
echo "--- Configurando Frontend ---"
npm install
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom

# Garantir Vite Config
cat > vite.config.ts << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
});
EOL

# Build
echo "Compilando aplicação..."
npx vite build

# 7. Configurar Nginx
echo "--- Configurando Nginx ---"
CONFIG_FILE="/etc/nginx/sites-available/alfred"
APP_DIR=$(pwd)

sudo bash -c "cat > $CONFIG_FILE" << EOL
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Ativar site
sudo ln -sf $CONFIG_FILE /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 8. Firewall
echo "--- Configurando Firewall ---"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# Não habilitamos o 'enable' forçado para evitar bloqueio ssh acidental, 
# mas permitimos as regras.
echo "y" | sudo ufw enable

echo "------------------------------------------------"
echo " Instalação Concluída com Sucesso!"
echo " Acesse: http://$DOMAIN"
echo "------------------------------------------------"
echo " Credenciais Admin:"
echo " Email: maisalem.md@gmail.com"
echo " Senha: Alfred@1992"
echo "------------------------------------------------"
