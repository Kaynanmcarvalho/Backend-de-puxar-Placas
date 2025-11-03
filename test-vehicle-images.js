/**
 * Script de teste para o sistema de busca de imagens de veículos
 * Testa normalização, scraping e fallback
 */

const { normalizeVehicleName, generateSearchVariations, detectVehicleType, extractYear } = require('./services/vehicleNameNormalizer');
const { searchVehicleImage } = require('./services/vehicleImageScraper');

// Casos de teste
const testCases = [
    'SANTANA CG',
    'YAMAHA FAZER250 BLUEFLEX 2014',
    'VOYAGE 1.6L MB5',
    'VOLKSWAGEN SANTANA CG1986 • Vermelha',
    'Yamaha R3 2016/2017 vermelha ABS',
    'Honda CG 160 2020 preta',
    'Chevrolet Onix 2019 branco',
    'Ford Ranger 2021 diesel 4x4'
];

console.log('='.repeat(70));
console.log('🧪 TESTE DO SISTEMA DE IMAGENS DE VEÍCULOS');
console.log('='.repeat(70));
console.log();

async function runTests() {
    for (const testCase of testCases) {
        console.log('─'.repeat(70));
        console.log(`📝 Teste: "${testCase}"`);
        console.log('─'.repeat(70));
        
        // 1. Normalização
        const normalized = normalizeVehicleName(testCase);
        const vehicleType = detectVehicleType(testCase);
        const year = extractYear(testCase);
        const variations = generateSearchVariations(testCase);
        
        console.log(`✅ Nome normalizado: "${normalized}"`);
        console.log(`✅ Tipo detectado: ${vehicleType}`);
        console.log(`✅ Ano extraído: ${year || 'não detectado'}`);
        console.log(`✅ Variações de busca (${variations.length}):`);
        variations.forEach((v, i) => console.log(`   ${i + 1}. "${v}"`));
        console.log();
        
        // 2. Busca de imagem (apenas primeira variação para economizar tempo)
        console.log(`🔍 Buscando imagem para: "${variations[0]}"`);
        
        try {
            const result = await searchVehicleImage(variations[0]);
            
            if (result.success) {
                console.log(`✅ SUCESSO! Imagem encontrada`);
                console.log(`   Fonte: ${result.source}`);
                console.log(`   URL: ${result.imageUrl.substring(0, 80)}...`);
                console.log(`   Total de imagens: ${result.allImages?.length || 1}`);
            } else {
                console.log(`❌ FALHA: ${result.error}`);
            }
        } catch (error) {
            console.log(`❌ ERRO: ${error.message}`);
        }
        
        console.log();
    }
    
    console.log('='.repeat(70));
    console.log('✅ TESTES CONCLUÍDOS');
    console.log('='.repeat(70));
    
    // Encerra o processo
    process.exit(0);
}

// Executa os testes
runTests().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
