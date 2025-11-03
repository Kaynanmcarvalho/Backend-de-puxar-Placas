# 🔥 Configuração do Firebase

Guia passo a passo para configurar o Firebase no projeto.

## ⚠️ Importante

O Firebase é **OPCIONAL**. O sistema funciona sem ele, mas:
- ✅ **Com Firebase**: Cache de imagens (evita scraping repetido)
- ❌ **Sem Firebase**: Faz scraping toda vez (mais lento)

## 📋 Passo a Passo

### 1. Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Escolha um nome (ex: `oficina-backend`)
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2. Ativar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de produção"
4. Selecione a localização (ex: `southamerica-east1` para São Paulo)
5. Clique em "Ativar"

### 3. Ativar Storage

1. No menu lateral, clique em "Storage"
2. Clique em "Começar"
3. Aceite as regras padrão
4. Clique em "Concluído"

### 4. Configurar Regras de Segurança

#### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Imagens/{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /vehicles/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 5. Gerar Service Account Key

1. Clique no ícone de engrenagem ⚙️ > "Configurações do projeto"
2. Vá para a aba "Contas de serviço"
3. Clique em "Gerar nova chave privada"
4. Clique em "Gerar chave"
5. Um arquivo JSON será baixado

### 6. Configurar Variáveis de Ambiente

Abra o arquivo `.env` e adicione:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"oficina-backend",...}
FIREBASE_STORAGE_BUCKET=oficina-backend.appspot.com
```

**Dica:** Copie todo o conteúdo do arquivo JSON baixado e cole em uma única linha.

## ✅ Testando a Configuração

Execute o servidor e faça uma requisição:

```bash
npm start
```

```bash
curl "http://localhost:3001/api/vehicle-images/search?name=Yamaha%20R3%202016"
```

Se configurado corretamente, você verá nos logs:

```
[FIREBASE] ✅ Inicializado com sucesso
[VEHICLE IMAGE API] 🔍 Buscando imagem para: "Yamaha R3 2016"
[VEHICLE IMAGE API] 📝 Nome normalizado: "yamaha r3 2016"
[VEHICLE IMAGE API] 🔄 Não encontrado no cache, iniciando scraping...
[GOOGLE IMAGES] 🔍 Buscando: yamaha r3 2016
[GOOGLE IMAGES] ✅ 5 imagens encontradas
[IMAGE DOWNLOAD] 📥 Baixando: https://...
[IMAGE DOWNLOAD] ✅ Download concluído
[VEHICLE IMAGE API] ✅ Imagem salva no Firebase
```

## 🔍 Verificando no Console

### Firestore

1. Acesse o Firebase Console
2. Vá em "Firestore Database"
3. Você verá a coleção "Imagens" com os documentos salvos

### Storage

1. Acesse o Firebase Console
2. Vá em "Storage"
3. Você verá a pasta "vehicles" com as imagens

## 🚨 Troubleshooting

### Erro: "Firebase não inicializado"

**Causa:** Credenciais não configuradas ou inválidas

**Solução:**
1. Verifique se o `.env` está correto
2. Certifique-se de que o JSON está em uma única linha
3. Verifique se não há espaços extras

### Erro: "Permission denied"

**Causa:** Regras de segurança muito restritivas

**Solução:**
1. Vá em Firestore > Regras
2. Adicione as regras mostradas acima
3. Publique as regras

### Erro: "Storage bucket not found"

**Causa:** Nome do bucket incorreto

**Solução:**
1. Vá em Storage no Firebase Console
2. Copie o nome do bucket (ex: `oficina-backend.appspot.com`)
3. Atualize o `.env`

## 💰 Custos

O Firebase tem um plano gratuito generoso:

- **Firestore:** 50.000 leituras/dia
- **Storage:** 5GB de armazenamento
- **Bandwidth:** 1GB/dia

Para este projeto, o plano gratuito é mais que suficiente.

## 🔒 Segurança

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` ou as credenciais do Firebase!

Adicione ao `.gitignore`:

```
.env
firebase-credentials.json
```
