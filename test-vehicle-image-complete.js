require('dotenv').config();
const axios = require('axios');

async function testVehicleImageAPI() {
    console.log('🧪 Testando API de Imagens de Veículos com Firebase\n');

    try {
        // Inicia o servidor
        console.log('🚀 Iniciando servidor...');
        const server = require('./server');
        
        // Aguarda um pouco para o servidor iniciar
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Testa busca de imagem
        console.log('\n📸 Testando busca de imagem...');
        const response = await axios.get('http://localhost:3001/api/vehicle-images/search', {
            params: {
                vehicleName: 'VOLKSWAGEN SANTANA CG 1986 Vermelha'
            }
        });

        console.log('\n✅ Resposta da API:');
        console.log('Status:', response.status);
        console.log('Imagem URL:', response.data.imageUrl ? '✅ Encontrada' : '❌ Não encontrada');
        console.log('Cached:', response.data.cached ? '✅ Sim' : '❌ Não');
        console.log('Source:', response.data.source);

        if (response.data.imageUrl) {
            console.log('\n🎉 Sucesso! Imagem encontrada e salva no Firebase!');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro no teste:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

testVehicleImageAPI();
