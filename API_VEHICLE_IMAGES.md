# 🖼️ API de Imagens de Veículos

Sistema inteligente de busca e cache de imagens de veículos com scraping automático e fallback.

## 🎯 Funcionalidades

- ✅ Normalização inteligente de nomes de veículos
- ✅ Remoção automática de informações desnecessárias (cor, versões como ABS/UBS)
- ✅ Extração de ano do veículo
- ✅ Detecção automática do tipo de veículo (moto, carro, caminhão, van)
- ✅ Cache no Firebase Firestore (evita scraping repetido)
- ✅ Scraping de múltiplas fontes com fallback automático
- ✅ Suporte a busca em lote

## 🌐 Fontes de Imagens

1. **Google Imagens** (principal)
2. **Webmotors** (fallback 1)
3. **Pexels** (fallback 2 - requer API key)

## 📡 Endpoints

### GET /api/vehicle-images/search

Busca imagem de um veículo (primeiro no cache, depois scraping).

**Query Parameters:**
- `name` (string, obrigatório): Nome do veículo

**Exemplo:**
```bash
GET /api/vehicle-images/search?name=Yamaha%20R3%202016%20vermelha%20ABS
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.googleapis.com/...",
    "originalName": "Yamaha R3 2016 vermelha ABS",
    "normalizedName": "yamaha r3 2016",
    "vehicleType": "moto",
    "year": "2016",
    "source": "google",
    "cached": false
  }
}
```

**Resposta de Erro (200):**
```json
{
  "success": false,
  "error": "Não foi possível encontrar imagens do veículo",
  "suggestions": [
    "Verifique se o nome do veículo está correto",
    "Tente com um nome mais genérico",
    "Tente novamente mais tarde"
  ]
}
```

---

### POST /api/vehicle-images/search

Busca imagem de um veículo (aceita JSON no body).

**Body:**
```json
{
  "name": "VOLKSWAGEN SANTANA CG1986 • Vermelha"
}
```

**Resposta:** Igual ao GET acima.

---

### POST /api/vehicle-images/batch

Busca imagens de múltiplos veículos em uma única requisição.

**Body:**
```json
{
  "vehicles": [
    "Yamaha R3 2016",
    "Honda CG 160 2020",
    "Chevrolet Onix 2019"
  ]
}
```

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "vehicleName": "Yamaha R3 2016",
        "success": true,
        "imageUrl": "https://...",
        "source": "google",
        "cached": false
      },
      {
        "vehicleName": "Honda CG 160 2020",
        "success": true,
        "imageUrl": "https://...",
        "cached": true
      },
      {
        "vehicleName": "Chevrolet Onix 2019",
        "success": false,
        "error": "Imagem não encontrada"
      }
    ]
  }
}
```

## 🧠 Normalização Inteligente

O sistema normaliza automaticamente os nomes dos veículos:

| Entrada | Saída Normalizada |
|---------|-------------------|
| `Yamaha R3 2016/2017 vermelha ABS` | `yamaha r3 2016` |
| `VOLKSWAGEN SANTANA CG1986 • Vermelha` | `volkswagen santana cg 1986` |
| `Honda CG 160 2020 preta flex` | `honda cg 160 2020` |
| `VOYAGE 1.6L MB5` | `voyage` |

### O que é removido:
- ❌ Cores (branco, preto, vermelho, etc)
- ❌ Versões (ABS, UBS, CBS, flex, turbo, etc)
- ❌ Características (completo, automático, manual, etc)
- ❌ Cilindradas isoladas (1.6L, 2.0, 250cc)
- ✅ Mantém: Marca, Modelo, Ano

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Obrigatório
PORT=3001

# Opcional - Firebase (para cache)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com

# Opcional - Pexels (fallback adicional)
PEXELS_API_KEY=sua_chave_pexels
```

### 2. Firebase Setup (Opcional)

Se quiser usar o cache no Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o Firestore Database
3. Ative o Storage
4. Gere uma Service Account Key em Project Settings > Service Accounts
5. Adicione as credenciais no `.env`

**Sem Firebase:** O sistema funciona normalmente, mas não salva cache (fará scraping toda vez).

### 3. Pexels API (Opcional)

Para usar o Pexels como fallback adicional:

1. Crie uma conta em [Pexels](https://www.pexels.com/api/)
2. Obtenha sua API key gratuita
3. Adicione no `.env`: `PEXELS_API_KEY=sua_chave`

## 🧪 Testes

Execute o script de teste para validar o sistema:

```bash
node test-vehicle-images.js
```

Isso testará:
- ✅ Normalização de nomes
- ✅ Detecção de tipo de veículo
- ✅ Extração de ano
- ✅ Busca de imagens com fallback

## 📦 Estrutura de Dados no Firestore

Coleção: `Imagens`

```json
{
  "originalName": "Yamaha R3 2016/2017 vermelha ABS",
  "normalizedName": "yamaha r3 2016",
  "vehicleType": "moto",
  "year": "2016",
  "imageUrl": "https://storage.googleapis.com/...",
  "source": "google",
  "allImages": ["url1", "url2", "url3"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## 🚀 Exemplos de Uso

### Frontend - Busca Simples

```javascript
async function buscarImagemVeiculo(nomeVeiculo) {
  const response = await fetch(
    `http://localhost:3001/api/vehicle-images/search?name=${encodeURIComponent(nomeVeiculo)}`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log('Imagem encontrada:', data.data.imageUrl);
    return data.data.imageUrl;
  } else {
    console.error('Erro:', data.error);
    return null;
  }
}

// Uso
const imageUrl = await buscarImagemVeiculo('Yamaha R3 2016 vermelha ABS');
```

### Frontend - Busca em Lote

```javascript
async function buscarImagensEmLote(veiculos) {
  const response = await fetch('http://localhost:3001/api/vehicle-images/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicles: veiculos })
  });
  
  const data = await response.json();
  return data.data.results;
}

// Uso
const veiculos = [
  'Yamaha R3 2016',
  'Honda CG 160 2020',
  'Chevrolet Onix 2019'
];

const resultados = await buscarImagensEmLote(veiculos);
resultados.forEach(r => {
  if (r.success) {
    console.log(`${r.vehicleName}: ${r.imageUrl}`);
  }
});
```

## ⚡ Performance

- **Cache Hit:** ~50-100ms (busca no Firestore)
- **Cache Miss:** ~3-10s (scraping + upload)
- **Batch:** Processa sequencialmente para evitar sobrecarga

## 🛡️ Tratamento de Erros

O sistema possui fallback em múltiplos níveis:

1. ✅ Busca no cache (Firestore)
2. ✅ Scraping Google Imagens
3. ✅ Scraping Webmotors
4. ✅ Scraping Pexels (se configurado)
5. ❌ Retorna erro amigável

## 📝 Notas Importantes

- O scraping pode ser bloqueado por sites se houver muitas requisições
- Use o cache (Firebase) para evitar scraping repetido
- O Google Imagens é a fonte mais confiável
- Webmotors funciona bem para carros brasileiros
- Pexels retorna imagens genéricas (menos específicas)

## 🔄 Fluxo de Funcionamento

```
Frontend envia nome do veículo
         ↓
Backend normaliza o nome
         ↓
Busca no cache (Firestore)
         ↓
    Encontrou?
    ↙        ↘
  SIM        NÃO
   ↓          ↓
Retorna   Faz scraping
imagem    (Google → Webmotors → Pexels)
           ↓
       Encontrou?
       ↙        ↘
     SIM        NÃO
      ↓          ↓
   Salva no   Retorna
   Firebase    erro
      ↓
   Retorna
   imagem
```

## 🐛 Troubleshooting

**Erro: "Chrome não encontrado"**
- Instale o Google Chrome
- Ou use `puppeteer` ao invés de `puppeteer-core`

**Erro: "Firebase não inicializado"**
- Verifique as credenciais no `.env`
- O sistema funciona sem Firebase, mas sem cache

**Nenhuma imagem encontrada**
- Tente com um nome mais genérico
- Verifique se o nome está correto
- Aguarde alguns segundos e tente novamente

## 📄 Licença

MIT
