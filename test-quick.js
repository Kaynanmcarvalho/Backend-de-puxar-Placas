/**
 * Teste rápido - apenas normalização (sem scraping)
 */

const { normalizeVehicleName, generateSearchVariations, detectVehicleType, extractYear } = require('./services/vehicleNameNormalizer');

console.log('='.repeat(70));
console.log('🧪 TESTE RÁPIDO - NORMALIZAÇÃO DE NOMES');
console.log('='.repeat(70));
console.log();

const testCases = [
    'SANTANA CG',
    'YAMAHA FAZER250 BLUEFLEX 2014',
    'VOYAGE 1.6L MB5',
    'VOLKSWAGEN SANTANA CG1986 • Vermelha',
    'Yamaha R3 2016/2017 vermelha ABS',
    'Honda CG 160 2020 preta',
    'Chevrolet Onix 2019 branco completo',
    'Ford Ranger 2021 diesel 4x4 turbo'
];

testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. Original: "${testCase}"`);
    
    const normalized = normalizeVehicleName(testCase);
    const vehicleType = detectVehicleType(testCase);
    const year = extractYear(testCase);
    const variations = generateSearchVariations(testCase);
    
    console.log(`   ✅ Normalizado: "${normalized}"`);
    console.log(`   ✅ Tipo: ${vehicleType}`);
    console.log(`   ✅ Ano: ${year || 'não detectado'}`);
    console.log(`   ✅ Variações (${variations.length}): ${variations.map(v => `"${v}"`).join(', ')}`);
    console.log();
});

console.log('='.repeat(70));
console.log('✅ TESTE CONCLUÍDO');
console.log('='.repeat(70));
