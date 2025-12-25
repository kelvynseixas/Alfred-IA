# Alfred IA - Ecossistema de Gestão Pessoal

Um sistema premium, omnichannel de gestão financeira, tarefas e listas com interface de IA conversacional.

## Stack Tecnológico

- **Frontend**: React 19, TailwindCSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL
- **IA**: Google Gemini API

## Instalação e Deploy (VPS Ubuntu 22.04 LTS)

Este projeto inclui um script de auto-instalação para facilitar o deploy em servidores Linux.

### Pré-requisitos
- Um servidor VPS com Ubuntu 22.04 LTS limpo.
- Acesso root ou usuário com privilégios sudo.
- Um domínio apontado para o IP do servidor (opcional, mas recomendado).

### Passo a Passo

1. Conecte-se ao seu servidor via SSH:
   ```bash
   ssh root@seu-ip-vps
   ```

2. Clone este repositório (ou faça upload dos arquivos):
   ```bash
   git clone https://seu-repositorio/alfred-ia.git
   cd alfred-ia
   ```

3. Dê permissão de execução ao script de instalação:
   ```bash
   chmod +x install.sh
   ```

4. Execute o instalador informando o seu domínio (ou IP se não tiver domínio):
   ```bash
   ./install.sh meudominio.com
   # ou
   ./install.sh 123.456.78.90
   ```

O script irá automaticamente:
- Atualizar o sistema.
- Instalar Node.js, Nginx e PostgreSQL.
- Configurar o Banco de Dados e criar o usuário Admin.
- Instalar dependências e iniciar o Backend com PM2.
- Construir o Frontend e configurar o Nginx como proxy reverso.
- Configurar firewall básico.

### Acesso ao Sistema

Após a instalação, acesse pelo navegador: `http://meudominio.com`

**Credenciais Padrão:**
- **Email:** `maisalem.md@gmail.com`
- **Senha:** `Alfred@1992`

> **Nota:** Por segurança, altere a senha do admin imediatamente após o primeiro login.

## Desenvolvimento Local

1. Instale as dependências: `npm install`
2. Configure o banco de dados Postgres localmente.
3. Crie um arquivo `.env` na pasta `server` com as credenciais do banco.
4. Inicie o backend: `cd server && node index.js`
5. Em outro terminal, inicie o frontend: `npm run dev`
