const express = require('express');
const router = express.Router();
const { normalizeVehicleName, generateSearchVariations, detectVehicleType, extractYear } = require('../services/vehicleNameNormalizer');
const { searchVehicleImage, downloadImage } = require('../services/vehicleImageScraper');
const { findImageInFirestore, saveImageToFirestore, uploadImageToStorage } = require('../services/firebaseService');

/**
 * GET /api/vehicle-images/search?name=Yamaha+R3+2016
 * Busca imagem do veículo (primeiro no cache, depois scraping)
 */
router.get('/search', async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro "name" é obrigatório'
            });
        }

        console.log(`[VEHICLE IMAGE API] 🔍 Buscando imagem para: "${name}"`);

        // Normaliza o nome do veículo
        const normalizedName = normalizeVehicleName(name);
        const vehicleType = detectVehicleType(name);
        const year = extractYear(name);

        console.log(`[VEHICLE IMAGE API] 📝 Nome normalizado: "${normalizedName}"`);
        console.log(`[VEHICLE IMAGE API] 🚗 Tipo detectado: ${vehicleType}`);
        console.log(`[VEHICLE IMAGE API] 📅 Ano: ${year || 'não detectado'}`);

        // 1. Tenta buscar no cache (Firestore)
        try {
            const cachedImage = await findImageInFirestore(normalizedName);

            if (cachedImage) {
                console.log('[VEHICLE IMAGE API] ✅ Imagem encontrada no cache!');
                return res.json({
                    success: true,
                    data: {
                        imageUrl: cachedImage.imageUrl,
                        originalName: cachedImage.originalName,
                        normalizedName: cachedImage.normalizedName,
                        vehicleType: cachedImage.vehicleType,
                        year: cachedImage.year,
                        source: cachedImage.source,
                        cached: true,
                        createdAt: cachedImage.createdAt
                    }
                });
            }
        } catch (cacheError) {
            console.warn('[VEHICLE IMAGE API] ⚠️  Erro ao buscar no cache:', cacheError.message);
            // Continua para o scraping
        }

        console.log('[VEHICLE IMAGE API] 🔄 Não encontrado no cache, iniciando scraping...');

        // 2. Faz scraping
        const searchVariations = generateSearchVariations(name);
        console.log(`[VEHICLE IMAGE API] 🎯 Tentando ${searchVariations.length} variações de busca`);

        let imageResult = null;

        for (const searchQuery of searchVariations) {
            console.log(`[VEHICLE IMAGE API] 🔍 Tentando: "${searchQuery}"`);
            imageResult = await searchVehicleImage(searchQuery);

            if (imageResult.success) {
                console.log(`[VEHICLE IMAGE API] ✅ Imagem encontrada com: "${searchQuery}"`);
                break;
            }
        }

        if (!imageResult || !imageResult.success) {
            console.log('[VEHICLE IMAGE API] ❌ Nenhuma imagem encontrada');
            return res.json({
                success: false,
                error: 'Não foi possível encontrar imagens do veículo',
                suggestions: [
                    'Verifique se o nome do veículo está correto',
                    'Tente com um nome mais genérico (ex: apenas marca e modelo)',
                    'Tente novamente mais tarde'
                ]
            });
        }

        // 3. Retorna a imagem IMEDIATAMENTE pro usuário
        console.log('[VEHICLE IMAGE API] ✅ Retornando imagem encontrada');

        res.json({
            success: true,
            data: {
                imageUrl: imageResult.imageUrl,
                originalName: name,
                normalizedName: normalizedName,
                vehicleType: vehicleType,
                year: year,
                source: imageResult.source,
                cached: false,
                allImages: imageResult.allImages || []
            }
        });

        // 4. Tenta salvar no Firebase em BACKGROUND (não bloqueia a resposta)
        (async () => {
            try {
                console.log('[VEHICLE IMAGE API] 🔄 Tentando salvar no Firebase em background...');

                // Download da imagem
                const imageBuffer = await downloadImage(imageResult.imageUrl);

                // Gera nome único para o arquivo
                const timestamp = Date.now();
                const fileName = `${normalizedName.replace(/\s+/g, '_')}_${timestamp}.jpg`;

                // Tenta upload para Storage
                try {
                    const storageUrl = await uploadImageToStorage(imageBuffer, fileName);

                    // Salva metadados no Firestore com URL do Storage
                    const firestoreData = {
                        originalName: name,
                        normalizedName: normalizedName,
                        vehicleType: vehicleType,
                        year: year,
                        imageUrl: storageUrl,
                        source: imageResult.source,
                        allImages: imageResult.allImages || []
                    };

                    await saveImageToFirestore(firestoreData);
                    console.log('[VEHICLE IMAGE API] ✅ Imagem salva no Firebase Storage + Firestore');

                } catch (storageError) {
                    console.warn('[VEHICLE IMAGE API] ⚠️  Erro no Storage, tentando salvar só no Firestore...');

                    // Se falhar no Storage, salva no Firestore com URL original
                    const firestoreData = {
                        originalName: name,
                        normalizedName: normalizedName,
                        vehicleType: vehicleType,
                        year: year,
                        imageUrl: imageResult.imageUrl, // URL original do scraping
                        source: imageResult.source,
                        allImages: imageResult.allImages || []
                    };

                    await saveImageToFirestore(firestoreData);
                    console.log('[VEHICLE IMAGE API] ✅ Imagem salva no Firestore (sem Storage)');
                }

            } catch (firebaseError) {
                console.warn('[VEHICLE IMAGE API] ⚠️  Erro ao salvar no Firebase:', firebaseError.message);
                // Não faz nada, a imagem já foi retornada pro usuário
            }
        })();

    } catch (error) {
        console.error('[VEHICLE IMAGE API] 💥 Erro geral:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar imagem: ' + error.message
        });
    }
});

/**
 * POST /api/vehicle-images/search
 * Busca imagem do veículo (aceita body JSON)
 */
router.post('/search', async (req, res) => {
    try {
        const { name, vehicleName } = req.body;
        const vehicleNameToUse = name || vehicleName;

        if (!vehicleNameToUse) {
            return res.status(400).json({
                success: false,
                error: 'Campo "name" ou "vehicleName" é obrigatório'
            });
        }

        // Redireciona para o GET handler
        req.query = { name: vehicleNameToUse };
        return router.handle(
            { ...req, method: 'GET', url: '/search' + `?name=${encodeURIComponent(vehicleNameToUse)}` },
            res
        );

    } catch (error) {
        console.error('[VEHICLE IMAGE API] 💥 Erro no POST:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar requisição: ' + error.message
        });
    }
});

/**
 * POST /api/vehicle-images/batch
 * Busca imagens de múltiplos veículos
 */
router.post('/batch', async (req, res) => {
    try {
        const { vehicles } = req.body;

        if (!vehicles || !Array.isArray(vehicles)) {
            return res.status(400).json({
                success: false,
                error: 'Campo "vehicles" deve ser um array de nomes'
            });
        }

        console.log(`[VEHICLE IMAGE API] 📦 Busca em lote: ${vehicles.length} veículos`);

        const results = [];

        for (const vehicleName of vehicles) {
            try {
                const normalizedName = normalizeVehicleName(vehicleName);

                // Tenta buscar no cache primeiro
                let cachedImage = null;
                try {
                    cachedImage = await findImageInFirestore(normalizedName);
                } catch (e) {
                    console.warn(`[BATCH] Erro ao buscar cache para "${vehicleName}":`, e.message);
                }

                if (cachedImage) {
                    results.push({
                        vehicleName: vehicleName,
                        success: true,
                        imageUrl: cachedImage.imageUrl,
                        cached: true
                    });
                    continue;
                }

                // Se não estiver no cache, faz scraping
                const searchVariations = generateSearchVariations(vehicleName);
                let imageResult = null;

                for (const searchQuery of searchVariations) {
                    imageResult = await searchVehicleImage(searchQuery);
                    if (imageResult.success) break;
                }

                if (imageResult && imageResult.success) {
                    results.push({
                        vehicleName: vehicleName,
                        success: true,
                        imageUrl: imageResult.imageUrl,
                        source: imageResult.source,
                        cached: false
                    });
                } else {
                    results.push({
                        vehicleName: vehicleName,
                        success: false,
                        error: 'Imagem não encontrada'
                    });
                }

            } catch (error) {
                results.push({
                    vehicleName: vehicleName,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`[VEHICLE IMAGE API] ✅ Busca em lote concluída: ${successCount}/${vehicles.length} sucessos`);

        res.json({
            success: true,
            data: {
                total: vehicles.length,
                successful: successCount,
                failed: vehicles.length - successCount,
                results: results
            }
        });

    } catch (error) {
        console.error('[VEHICLE IMAGE API] 💥 Erro no batch:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar lote: ' + error.message
        });
    }
});

module.exports = router;
