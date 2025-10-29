# Oficina Backend API

Backend API para sistema de oficina - Consulta de placas e veículos.

## 🚀 Deploy no Railway

### Passo a passo:

1. **Conecte seu repositório**
   - Acesse [railway.app](https://railway.app)
   - Clique em "New Project" → "Deploy from GitHub repo"
   - Selecione este repositório

2. **Configure as variáveis de ambiente**
   No Railway, adicione estas variáveis:
   ```
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://seu-frontend.vercel.app
   ```

3. **Deploy automático**
   - O Railway vai detectar automaticamente o `nixpacks.toml`
   - O build vai instalar Node.js 20 e Chromium (para Puppeteer)
   - O deploy inicia automaticamente com `npm start`

4. **Obtenha a URL**
   - Após o deploy, copie a URL gerada (ex: `https://seu-app.railway.app`)
   - Use essa URL no seu frontend

### Configurações incluídas:

- ✅ `nixpacks.toml` - Configuração de build com Chromium
- ✅ `railway.json` - Configuração de deploy
- ✅ `.railwayignore` - Arquivos ignorados no deploy
- ✅ `Procfile` - Comando de inicialização
- ✅ CORS configurado para produção
- ✅ Health check endpoint: `/health`

## 🔧 Desenvolvimento Local

```bash
npm install
npm run dev
```

## 📡 Endpoints

- `GET /health` - Health check
- `GET /api/vehicles/:plate` - Consulta de placa

## 🌍 Variáveis de Ambiente

Copie `.env.example` para `.env` e configure conforme necessário.
