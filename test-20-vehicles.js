/**
 * Teste de scraping de 20 veículos diferentes
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/vehicle-images/search';

// Lista de 20 veículos para testar
const vehicles = [
    // Motos Honda
    'Honda Titan 150 2020',
    'Honda Titan 160 2021',
    'Honda Fan 125 2019',
    'Honda Fan 160 2022',
    'Honda CG 150 2018',
    'Honda CG 160 2023',
    'Honda Biz 110 2020',
    'Honda Biz 125 2021',
    
    // Motos Yamaha
    'Yamaha R3 2016',
    'Yamaha R3 2020',
    'Yamaha Fazer 250 2015',
    'Yamaha Fazer 250 Blueflex 2014',
    'Yamaha XTZ 150 2019',
    'Yamaha Factor 150 2020',
    
    // Carros Volkswagen
    'Volkswagen Gol 2018',
    'Volkswagen Gol 2020',
    'Volkswagen Voyage 2017',
    'Volkswagen Polo 2019',
    
    // Carros Chevrolet
    'Chevrolet Onix 2019',
    'Chevrolet Prisma 2018'
];

console.log('='.repeat(80));
console.log('🧪 TESTE DE SCRAPING - 20 VEÍCULOS');
console.log('='.repeat(80));
console.log();

async function testVehicle(vehicleName, index) {
    try {
        console.log(`[${index + 1}/20] 🔍 Buscando: ${vehicleName}`);
        
        const response = await axios.get(API_URL, {
            params: { name: vehicleName },
            timeout: 60000 // 60 segundos
        });
        
        if (response.data.success) {
            const data = response.data.data;
            console.log(`[${index + 1}/20] ✅ SUCESSO!`);
            console.log(`         📸 URL: ${data.imageUrl.substring(0, 60)}...`);
            console.log(`         🏷️  Normalizado: ${data.normalizedName}`);
            console.log(`         🚗 Tipo: ${data.vehicleType} | Ano: ${data.year || 'N/A'}`);
            console.log(`         📦 Fonte: ${data.source} | Cache: ${data.cached ? 'SIM' : 'NÃO'}`);
            return { success: true, vehicle: vehicleName };
        } else {
            console.log(`[${index + 1}/20] ❌ FALHOU: ${response.data.error}`);
            return { success: false, vehicle: vehicleName, error: response.data.error };
        }
        
    } catch (error) {
        console.log(`[${index + 1}/20] ❌ ERRO: ${error.message}`);
        return { success: false, vehicle: vehicleName, error: error.message };
    }
    
    console.log();
}

async function runTests() {
    const results = [];
    
    console.log(`📋 Total de veículos para testar: ${vehicles.length}`);
    console.log();
    console.log('-'.repeat(80));
    console.log();
    
    // Testa cada veículo sequencialmente
    for (let i = 0; i < vehicles.length; i++) {
        const result = await testVehicle(vehicles[i], i);
        results.push(result);
        console.log();
        
        // Pequena pausa entre requisições
        if (i < vehicles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Resumo final
    console.log('='.repeat(80));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(80));
    console.log();
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Sucessos: ${successful}/${vehicles.length} (${((successful/vehicles.length)*100).toFixed(1)}%)`);
    console.log(`❌ Falhas: ${failed}/${vehicles.length} (${((failed/vehicles.length)*100).toFixed(1)}%)`);
    console.log();
    
    if (failed > 0) {
        console.log('❌ Veículos que falharam:');
        results.filter(r => !r.success).forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.vehicle}`);
            console.log(`      Erro: ${r.error}`);
        });
        console.log();
    }
    
    console.log('='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO!');
    console.log('='.repeat(80));
    
    process.exit(0);
}

// Executa os testes
runTests().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
