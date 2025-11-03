const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// Cache do browser
let browserInstance = null;

/**
 * Obtém ou cria instância do browser
 */
async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    console.log('[IMAGE SCRAPER] 🚀 Iniciando browser...');

    browserInstance = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    console.log('[IMAGE SCRAPER] ✅ Browser iniciado');
    return browserInstance;
}

/**
 * Scraper do Google Imagens (principal) - Pega imagens em ALTA QUALIDADE
 */
async function scrapeGoogleImages(searchQuery) {
    let page = null;

    try {
        console.log(`[GOOGLE IMAGES] 🔍 Buscando: ${searchQuery}`);

        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch&hl=pt-BR`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Aguarda as imagens carregarem
        await page.waitForSelector('img', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Scroll para carregar mais imagens
        await page.evaluate(() => window.scrollBy(0, 300));
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('[GOOGLE IMAGES] 🖱️  Clicando nas imagens para pegar alta qualidade...');

        const highQualityUrls = [];

        // Tenta clicar nas primeiras 5 imagens para pegar URLs de alta qualidade
        for (let i = 0; i < 5; i++) {
            try {
                // Seleciona todas as imagens thumbnail
                const thumbnails = await page.$$('img[src*="encrypted"]');

                if (thumbnails.length > i) {
                    // Clica na imagem
                    await thumbnails[i].click();
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Extrai a URL da imagem em alta qualidade
                    const highQualityUrl = await page.evaluate(() => {
                        // Procura pela imagem grande no painel lateral
                        const largeImages = Array.from(document.querySelectorAll('img'));

                        for (const img of largeImages) {
                            const src = img.src;

                            // Procura por imagens que NÃO sejam thumbnails
                            if (src &&
                                src.startsWith('http') &&
                                !src.includes('encrypted-tbn') && // Exclui thumbnails
                                !src.includes('gstatic.com/images') && // Exclui ícones do Google
                                !src.includes('google.com/images/branding') &&
                                !src.includes('googlelogo') &&
                                src.length > 100 &&
                                img.naturalWidth > 200) { // Apenas imagens com largura > 200px
                                return src;
                            }
                        }

                        // Se não encontrou, tenta pegar do atributo data-src
                        const imgWithDataSrc = document.querySelector('img[data-src]:not([src*="encrypted-tbn"])');
                        if (imgWithDataSrc) {
                            return imgWithDataSrc.getAttribute('data-src') || imgWithDataSrc.src;
                        }

                        return null;
                    });

                    if (highQualityUrl && !highQualityUrls.includes(highQualityUrl)) {
                        console.log(`[GOOGLE IMAGES] ✅ Imagem ${i + 1} encontrada (${highQualityUrl.length} chars)`);
                        highQualityUrls.push(highQualityUrl);
                    } else {
                        console.log(`[GOOGLE IMAGES] ⚠️  Imagem ${i + 1} não encontrada ou duplicada`);
                    }

                    // Se já encontrou 3 imagens, para
                    if (highQualityUrls.length >= 3) {
                        break;
                    }
                }
            } catch (clickError) {
                console.log(`[GOOGLE IMAGES] ⚠️  Erro ao processar imagem ${i + 1}:`, clickError.message);
            }
        }

        await page.close();

        if (highQualityUrls.length > 0) {
            console.log(`[GOOGLE IMAGES] ✅ ${highQualityUrls.length} imagens de alta qualidade encontradas`);
            console.log(`[GOOGLE IMAGES] 📸 Primeira URL: ${highQualityUrls[0].substring(0, 100)}...`);
            return { success: true, images: highQualityUrls };
        }

        console.log('[GOOGLE IMAGES] ⚠️  Nenhuma imagem de alta qualidade encontrada');
        return { success: false, images: [] };

    } catch (error) {
        console.error('[GOOGLE IMAGES] ❌ Erro:', error.message);
        if (page) await page.close().catch(() => { });
        return { success: false, images: [], error: error.message };
    }
}

/**
 * Scraper do Webmotors (fallback 1)
 */
async function scrapeWebmotors(searchQuery) {
    let page = null;

    try {
        console.log(`[WEBMOTORS] 🔍 Buscando: ${searchQuery}`);

        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });

        const searchUrl = `https://www.webmotors.com.br/comprar/${encodeURIComponent(searchQuery.replace(/\s+/g, '-'))}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForSelector('img', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const imageUrls = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img[src*="webmotors"]'));
            return images
                .map(img => img.src)
                .filter(src => src && src.includes('http'))
                .slice(0, 3);
        });

        await page.close();

        if (imageUrls.length > 0) {
            console.log(`[WEBMOTORS] ✅ ${imageUrls.length} imagens encontradas`);
            return { success: true, images: imageUrls };
        }

        console.log('[WEBMOTORS] ⚠️  Nenhuma imagem encontrada');
        return { success: false, images: [] };

    } catch (error) {
        console.error('[WEBMOTORS] ❌ Erro:', error.message);
        if (page) await page.close().catch(() => { });
        return { success: false, images: [], error: error.message };
    }
}

/**
 * Scraper do Pexels (fallback 2 - imagens genéricas de veículos)
 */
async function scrapePexels(searchQuery) {
    try {
        console.log(`[PEXELS] 🔍 Buscando: ${searchQuery}`);

        // Pexels API (gratuita, mas limitada)
        const apiKey = process.env.PEXELS_API_KEY;

        if (!apiKey) {
            console.log('[PEXELS] ⚠️  API Key não configurada');
            return { success: false, images: [] };
        }

        const response = await axios.get('https://api.pexels.com/v1/search', {
            params: {
                query: searchQuery,
                per_page: 3
            },
            headers: {
                'Authorization': apiKey
            },
            timeout: 10000
        });

        const imageUrls = response.data.photos.map(photo => photo.src.large);

        if (imageUrls.length > 0) {
            console.log(`[PEXELS] ✅ ${imageUrls.length} imagens encontradas`);
            return { success: true, images: imageUrls };
        }

        console.log('[PEXELS] ⚠️  Nenhuma imagem encontrada');
        return { success: false, images: [] };

    } catch (error) {
        console.error('[PEXELS] ❌ Erro:', error.message);
        return { success: false, images: [], error: error.message };
    }
}

/**
 * Busca imagem com fallback automático
 */
async function searchVehicleImage(searchQuery) {
    console.log(`[IMAGE SEARCH] 🎯 Iniciando busca: "${searchQuery}"`);

    // Tenta Google Imagens primeiro (principal)
    let result = await scrapeGoogleImages(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'google'
        };
    }

    console.log('[IMAGE SEARCH] 🔄 Google falhou, tentando Webmotors...');

    // Fallback 1: Webmotors
    result = await scrapeWebmotors(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'webmotors'
        };
    }

    console.log('[IMAGE SEARCH] 🔄 Webmotors falhou, tentando Pexels...');

    // Fallback 2: Pexels
    result = await scrapePexels(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'pexels'
        };
    }

    console.log('[IMAGE SEARCH] ❌ Todas as fontes falharam');
    return {
        success: false,
        error: 'Não foi possível encontrar imagens do veículo'
    };
}

/**
 * Download da imagem
 */
async function downloadImage(imageUrl) {
    try {
        console.log(`[IMAGE DOWNLOAD] 📥 Baixando: ${imageUrl}`);

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('[IMAGE DOWNLOAD] ✅ Download concluído');
        return Buffer.from(response.data);

    } catch (error) {
        console.error('[IMAGE DOWNLOAD] ❌ Erro:', error.message);
        throw error;
    }
}

// Cleanup
process.on('exit', () => {
    if (browserInstance) {
        browserInstance.close().catch(() => { });
    }
});

module.exports = {
    searchVehicleImage,
    downloadImage,
    scrapeGoogleImages,
    scrapeWebmotors,
    scrapePexels
};
