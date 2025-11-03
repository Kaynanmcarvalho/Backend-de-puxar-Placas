/**
 * Normaliza o nome do veículo para busca e cache
 * Remove informações desnecessárias como cor, versões específicas (ABS, UBS), etc.
 * Mantém marca, modelo e ano
 */

// Palavras a serem removidas (versões, características, cores)
const REMOVE_KEYWORDS = [
    // Versões e características
    'abs', 'ubs', 'cbs', 'ebs', 'tcs', 'flex', 'blueflex', 'totalflex',
    'turbo', 'sport', 'limited', 'premium', 'deluxe', 'standard',
    'automatico', 'manual', 'automatica', 'mecanica',
    'completo', 'completa', 'basico', 'basica',
    'edition', 'special', 'exclusive', 'comfort',
    
    // Cores
    'branco', 'branca', 'preto', 'preta', 'vermelho', 'vermelha',
    'azul', 'amarelo', 'amarela', 'verde', 'cinza', 'prata',
    'dourado', 'dourada', 'laranja', 'rosa', 'roxo', 'roxa',
    'bege', 'marrom', 'vinho',
    
    // Combustível (mantemos apenas se for importante)
    'gasolina', 'alcool', 'diesel', 'gnv', 'eletrico', 'hibrido',
    
    // Outros
    'zero', 'km', '0km', 'novo', 'nova', 'usado', 'usada'
];

// Padrões de ano: 2016, 2016/2017, 16/17, etc.
const YEAR_PATTERNS = [
    /\b(19|20)\d{2}\/(19|20)?\d{2}\b/g,  // 2016/2017 ou 2016/17
    /\b(19|20)\d{2}\b/g,                  // 2016
    /\b\d{2}\/\d{2}\b/g                   // 16/17
];

/**
 * Extrai o ano do nome do veículo
 */
function extractYear(vehicleName) {
    const name = vehicleName.toLowerCase();
    
    // Tenta encontrar ano no formato completo (2016/2017 ou 2016)
    for (const pattern of YEAR_PATTERNS) {
        const match = name.match(pattern);
        if (match) {
            const yearStr = match[0];
            // Se for formato 2016/2017, pega o primeiro ano
            if (yearStr.includes('/')) {
                const firstYear = yearStr.split('/')[0];
                // Se for formato curto (16/17), converte para completo
                if (firstYear.length === 2) {
                    return '20' + firstYear;
                }
                return firstYear;
            }
            // Se for formato curto (16), converte para completo
            if (yearStr.length === 2) {
                return '20' + yearStr;
            }
            return yearStr;
        }
    }
    
    return null;
}

/**
 * Normaliza o nome do veículo
 * Exemplo: "Yamaha R3 2016/2017 vermelha ABS" -> "yamaha r3 2016"
 */
function normalizeVehicleName(vehicleName) {
    if (!vehicleName || typeof vehicleName !== 'string') {
        return '';
    }

    let normalized = vehicleName.toLowerCase().trim();
    
    // Extrai o ano antes de remover
    const year = extractYear(normalized);
    
    // Remove caracteres especiais, mantém apenas letras, números e espaços
    normalized = normalized.replace(/[^\w\s]/g, ' ');
    
    // Remove múltiplos espaços
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Remove palavras-chave desnecessárias
    const words = normalized.split(' ');
    const filteredWords = words.filter(word => {
        // Remove palavras vazias
        if (!word) return false;
        
        // Remove números que não sejam anos (ex: 250, 1.6, etc)
        if (/^\d+$/.test(word) && word.length < 4) return false;
        if (/^\d+\.\d+$/.test(word)) return false; // Remove 1.6, 2.0, etc
        
        // Remove palavras da lista de exclusão
        if (REMOVE_KEYWORDS.includes(word)) return false;
        
        // Remove anos (vamos adicionar de forma controlada depois)
        if (/^(19|20)\d{2}$/.test(word)) return false;
        
        return true;
    });
    
    // Reconstrói o nome
    normalized = filteredWords.join(' ').trim();
    
    // Adiciona o ano no final se foi encontrado
    if (year) {
        normalized += ' ' + year;
    }
    
    return normalized;
}

/**
 * Gera variações do nome para busca
 * Útil para tentar diferentes combinações se a primeira falhar
 */
function generateSearchVariations(vehicleName) {
    const normalized = normalizeVehicleName(vehicleName);
    const variations = [normalized];
    
    // Variação sem ano
    const withoutYear = normalized.replace(/\b(19|20)\d{2}\b/g, '').trim();
    if (withoutYear !== normalized) {
        variations.push(withoutYear);
    }
    
    // Variação apenas com marca e modelo (primeiras 2-3 palavras)
    const words = normalized.split(' ');
    if (words.length > 2) {
        variations.push(words.slice(0, 2).join(' '));
        if (words.length > 3) {
            variations.push(words.slice(0, 3).join(' '));
        }
    }
    
    return [...new Set(variations)]; // Remove duplicatas
}

/**
 * Detecta o tipo de veículo baseado no nome
 */
function detectVehicleType(vehicleName) {
    const name = vehicleName.toLowerCase();
    
    // Marcas de motos
    const motoBrands = ['yamaha', 'honda', 'suzuki', 'kawasaki', 'ducati', 'bmw', 'harley', 'triumph', 'ktm'];
    
    // Palavras-chave de motos
    const motoKeywords = ['moto', 'motocicleta', 'scooter', 'trail', 'custom', 'naked', 'sport'];
    
    // Palavras-chave de caminhões
    const truckKeywords = ['caminhao', 'caminhão', 'truck', 'cargo', 'iveco', 'scania', 'volvo', 'mercedes'];
    
    // Palavras-chave de vans/ônibus
    const vanKeywords = ['van', 'onibus', 'ônibus', 'bus', 'sprinter', 'ducato'];
    
    // Verifica tipo
    if (motoKeywords.some(k => name.includes(k)) || motoBrands.some(b => name.includes(b))) {
        return 'moto';
    }
    
    if (truckKeywords.some(k => name.includes(k))) {
        return 'caminhao';
    }
    
    if (vanKeywords.some(k => name.includes(k))) {
        return 'van';
    }
    
    // Default: carro
    return 'carro';
}

module.exports = {
    normalizeVehicleName,
    extractYear,
    generateSearchVariations,
    detectVehicleType
};
