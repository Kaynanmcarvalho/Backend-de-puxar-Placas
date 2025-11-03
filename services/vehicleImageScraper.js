const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');

puppeteer.use(StealthPlugin());

let browserInstance = null;

async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    console.log('[IMAGE SCRAPER] Iniciando browser...');
    
    browserInstance = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1920,1080']
    });

    console.log('[IMAGE SCRAPER] Browser iniciado');
    return browserInstance;
}

async function scrapeGoogleImages(searchQuery) {
    let page = null;
    
    try {
        console.log(`[GOOGLE IMAGES] Buscando: ${searchQuery}`);
        
        const browser = await getBrowser();
        page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch&hl=pt-BR`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        await page.waitForSelector('img', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.evaluate(() => window.scrollBy(0, 500));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('[GOOGLE IMAGES] Extraindo URLs...');
        
        const imageUrls = await page.evaluate(() => {
            const urls = [];
            const images = Array.from(document.querySelectorAll('img'));
            
            images.forEach(img => {
                const src = img.src;
                
                if (src && 
                    src.startsWith('http') && 
                    !src.includes('google.com/images/branding') &&
                    !src.includes('googlelogo') &&
                    !src.includes('gstatic.com/s/i/') &&
                    !src.includes('24px.svg') &&
                    src.length > 80) {
                    urls.push(src);
                }
            });
            
            return urls;
        });
        
        await page.close();
        
        if (imageUrls.length > 0) {
            console.log(`[GOOGLE IMAGES] ${imageUrls.length} imagens encontradas`);
            return { success: true, images: imageUrls.slice(0, 5) };
        }
        
        console.log('[GOOGLE IMAGES] Nenhuma imagem encontrada');
        return { success: false, images: [] };
        
    } catch (error) {
        console.error('[GOOGLE IMAGES] Erro:', error.message);
        if (page) await page.close().catch(() => {});
        return { success: false, images: [], error: error.message };
    }
}

async function scrapeWebmotors(searchQuery) {
    let page = null;
    
    try {
        console.log(`[WEBMOTORS] Buscando: ${searchQuery}`);
        
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
            console.log(`[WEBMOTORS] ${imageUrls.length} imagens encontradas`);
            return { success: true, images: imageUrls };
        }
        
        console.log('[WEBMOTORS] Nenhuma imagem encontrada');
        return { success: false, images: [] };
        
    } catch (error) {
        console.error('[WEBMOTORS] Erro:', error.message);
        if (page) await page.close().catch(() => {});
        return { success: false, images: [], error: error.message };
    }
}

async function scrapePexels(searchQuery) {
    try {
        console.log(`[PEXELS] Buscando: ${searchQuery}`);
        
        const apiKey = process.env.PEXELS_API_KEY;
        
        if (!apiKey) {
            console.log('[PEXELS] API Key nao configurada');
            return { success: false, images: [] };
        }
        
        const response = await axios.get('https://api.pexels.com/v1/search', {
            params: { query: searchQuery, per_page: 3 },
            headers: { 'Authorization': apiKey },
            timeout: 10000
        });
        
        const imageUrls = response.data.photos.map(photo => photo.src.large);
        
        if (imageUrls.length > 0) {
            console.log(`[PEXELS] ${imageUrls.length} imagens encontradas`);
            return { success: true, images: imageUrls };
        }
        
        console.log('[PEXELS] Nenhuma imagem encontrada');
        return { success: false, images: [] };
        
    } catch (error) {
        console.error('[PEXELS] Erro:', error.message);
        return { success: false, images: [], error: error.message };
    }
}

async function searchVehicleImage(searchQuery) {
    console.log(`[IMAGE SEARCH] Iniciando busca: "${searchQuery}"`);
    
    let result = await scrapeGoogleImages(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'google'
        };
    }
    
    console.log('[IMAGE SEARCH] Google falhou, tentando Webmotors...');
    
    result = await scrapeWebmotors(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'webmotors'
        };
    }
    
    console.log('[IMAGE SEARCH] Webmotors falhou, tentando Pexels...');
    
    result = await scrapePexels(searchQuery);
    if (result.success && result.images.length > 0) {
        return {
            success: true,
            imageUrl: result.images[0],
            allImages: result.images,
            source: 'pexels'
        };
    }
    
    console.log('[IMAGE SEARCH] Todas as fontes falharam');
    return {
        success: false,
        error: 'Nao foi possivel encontrar imagens do veiculo'
    };
}

async function downloadImage(imageUrl) {
    try {
        console.log(`[IMAGE DOWNLOAD] Baixando: ${imageUrl}`);
        
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        console.log('[IMAGE DOWNLOAD] Download concluido');
        return Buffer.from(response.data);
        
    } catch (error) {
        console.error('[IMAGE DOWNLOAD] Erro:', error.message);
        throw error;
    }
}

process.on('exit', () => {
    if (browserInstance) {
        browserInstance.close().catch(() => {});
    }
});

module.exports = {
    searchVehicleImage,
    downloadImage,
    scrapeGoogleImages,
    scrapeWebmotors,
    scrapePexels
};
