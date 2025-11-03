# 📚 Exemplos de Uso - API de Imagens de Veículos

## 🚀 Iniciando o Servidor

```bash
npm start
```

O servidor estará disponível em: `http://localhost:3001`

## 📡 Exemplos de Requisições

### 1. Busca Simples (GET)

```bash
# Exemplo 1: Yamaha R3
curl "http://localhost:3001/api/vehicle-images/search?name=Yamaha%20R3%202016%20vermelha%20ABS"

# Exemplo 2: Honda CG
curl "http://localhost:3001/api/vehicle-images/search?name=Honda%20CG%20160%202020"

# Exemplo 3: Chevrolet Onix
curl "http://localhost:3001/api/vehicle-images/search?name=Chevrolet%20Onix%202019%20branco"
```

### 2. Busca com POST

```bash
curl -X POST http://localhost:3001/api/vehicle-images/search \
  -H "Content-Type: application/json" \
  -d '{"name": "VOLKSWAGEN SANTANA CG1986 • Vermelha"}'
```

### 3. Busca em Lote

```bash
curl -X POST http://localhost:3001/api/vehicle-images/batch \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [
      "Yamaha R3 2016",
      "Honda CG 160 2020",
      "Chevrolet Onix 2019"
    ]
  }'
```

## 💻 Integração Frontend

### React/Next.js

```javascript
// services/vehicleImageService.js
const API_URL = 'http://localhost:3001/api/vehicle-images';

export async function buscarImagemVeiculo(nomeVeiculo) {
  try {
    const response = await fetch(
      `${API_URL}/search?name=${encodeURIComponent(nomeVeiculo)}`
    );
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        imageUrl: data.data.imageUrl,
        cached: data.data.cached
      };
    }
    
    return {
      success: false,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Componente React
import { useState } from 'react';
import { buscarImagemVeiculo } from './services/vehicleImageService';

function VehicleImageSearch() {
  const [vehicleName, setVehicleName] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const result = await buscarImagemVeiculo(vehicleName);
    
    if (result.success) {
      setImageUrl(result.imageUrl);
    } else {
      alert(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <input
        type="text"
        value={vehicleName}
        onChange={(e) => setVehicleName(e.target.value)}
        placeholder="Ex: Yamaha R3 2016"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar Imagem'}
      </button>
      
      {imageUrl && (
        <img src={imageUrl} alt={vehicleName} style={{ maxWidth: '400px' }} />
      )}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
async function buscarImagemVeiculo(nomeVeiculo) {
  const response = await fetch(
    `http://localhost:3001/api/vehicle-images/search?name=${encodeURIComponent(nomeVeiculo)}`
  );
  const data = await response.json();
  return data;
}

// Uso
document.getElementById('btnBuscar').addEventListener('click', async () => {
  const nomeVeiculo = document.getElementById('inputVeiculo').value;
  const resultado = await buscarImagemVeiculo(nomeVeiculo);
  
  if (resultado.success) {
    document.getElementById('imgVeiculo').src = resultado.data.imageUrl;
  } else {
    alert(resultado.error);
  }
});
```

## 🧪 Testando a API

### Teste 1: Normalização

```bash
node test-quick.js
```

### Teste 2: Scraping Completo

```bash
node test-vehicle-images.js
```

## 📊 Respostas Esperadas

### Sucesso (Cache Hit)

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
    "cached": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Sucesso (Scraping)

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.googleapis.com/...",
    "originalName": "Honda CG 160 2020",
    "normalizedName": "honda cg 2020",
    "vehicleType": "moto",
    "year": "2020",
    "source": "google",
    "cached": false
  }
}
```

### Erro

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
