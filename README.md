URLs da API e Exemplos
🔗 URL Base da API
http://localhost:3001/api/vehicle-images/search
🏍️ Exemplo 1: MOTO (Yamaha R3)
Requisição:
GET http://localhost:3001/api/vehicle-images/search?name=Yamaha%20R3%202016/2017%20vermelha%20ABS
ou

curl "http://localhost:3001/api/vehicle-images/search?name=Yamaha%20R3%202016/2017%20vermelha%20ABS"
Normalização:
Original: Yamaha R3 2016/2017 vermelha ABS
Normalizado: yamaha r3 2016
Tipo detectado: moto
Ano extraído: 2016
Variações de busca:
yamaha r3 2016
yamaha r3
Como salva no Firestore:
Coleção: Imagens

Documento:

{
  "originalName": "Yamaha R3 2016/2017 vermelha ABS",
  "normalizedName": "yamaha r3 2016",
  "vehicleType": "moto",
  "year": "2016",
  "imageUrl": "https://storage.googleapis.com/seu-bucket/vehicles/yamaha_r3_2016_1730654321000.jpg",
  "source": "google",
  "allImages": [
    "https://image.webmotors.com.br/.../yamaha-yzf-r3.webp",
    "https://blogger.googleusercontent.com/.../yamaha-r3.jpg",
    "https://encrypted-tbn0.gstatic.com/.../yamaha.jpg"
  ],
  "createdAt": "2024-11-03T18:00:00.000Z",
  "updatedAt": "2024-11-03T18:00:00.000Z"
}
🚗 Exemplo 2: CARRO (Volkswagen Gol)
Requisição:
GET http://localhost:3001/api/vehicle-images/search?name=VOLKSWAGEN%20GOL%201.6%202018%20branco%20completo
ou

curl "http://localhost:3001/api/vehicle-images/search?name=VOLKSWAGEN%20GOL%201.6%202018%20branco%20completo"
Normalização:
Original: VOLKSWAGEN GOL 1.6 2018 branco completo
Normalizado: volkswagen gol 2018
Tipo detectado: carro
Ano extraído: 2018
Variações de busca:
volkswagen gol 2018
volkswagen gol
Como salva no Firestore:
Coleção: Imagens

Documento:

{
  "originalName": "VOLKSWAGEN GOL 1.6 2018 branco completo",
  "normalizedName": "volkswagen gol 2018",
  "vehicleType": "carro",
  "year": "2018",
  "imageUrl": "https://storage.googleapis.com/seu-bucket/vehicles/volkswagen_gol_2018_1730654456000.jpg",
  "source": "google",
  "allImages": [
    "https://blogger.googleusercontent.com/.../novo-VW-Gol-2017.jpg",
    "https://image.webmotors.com.br/.../volkswagen-gol.webp",
    "https://encrypted-tbn0.gstatic.com/.../gol.jpg"
  ],
  "createdAt": "2024-11-03T18:02:00.000Z",
  "updatedAt": "2024-11-03T18:02:00.000Z"
}
📊 Estrutura do Firestore
Firestore Database
└── Imagens (coleção)
    ├── documento_id_1
    │   ├── originalName: "Yamaha R3 2016/2017 vermelha ABS"
    │   ├── normalizedName: "yamaha r3 2016"
    │   ├── vehicleType: "moto"
    │   ├── year: "2016"
    │   ├── imageUrl: "https://storage.googleapis.com/..."
    │   ├── source: "google"
    │   ├── allImages: [...]
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
    │
    ├── documento_id_2
    │   ├── originalName: "VOLKSWAGEN GOL 1.6 2018 branco completo"
    │   ├── normalizedName: "volkswagen gol 2018"
    │   ├── vehicleType: "carro"
    │   ├── year: "2018"
    │   ├── imageUrl: "https://storage.googleapis.com/..."
    │   ├── source: "google"
    │   ├── allImages: [...]
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
    │
    └── ... (outros veículos)
🔍 Como funciona a busca no cache:
Frontend envia: "Yamaha R3 2016/2017 vermelha ABS"
Backend normaliza para: "yamaha r3 2016"
Busca no Firestore: WHERE normalizedName == "yamaha r3 2016"
Se encontrar: Retorna a imagem do cache (rápido ⚡)
Se não encontrar: Faz scraping e salva no Firestore
🎯 Variações que serão testadas:
Moto (Yamaha R3 2016/2017 vermelha ABS):
yamaha r3 2016 ← tenta primeiro
yamaha r3 ← se falhar, tenta sem ano
Carro (VOLKSWAGEN GOL 1.6 2018 branco completo):
volkswagen gol 2018 ← tenta primeiro
volkswagen gol ← se falhar, tenta sem ano