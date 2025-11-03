const admin = require('firebase-admin');

let db = null;
let storage = null;
let initialized = false;

/**
 * Inicializa o Firebase Admin SDK usando variáveis de ambiente
 */
function initializeFirebase() {
    if (initialized) {
        return { db, storage };
    }

    try {
        // Lê as credenciais do .env
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

        if (!serviceAccountJson || !storageBucket) {
            console.warn('[FIREBASE] ⚠️  Credenciais não configuradas no .env');
            console.warn('[FIREBASE] 💡 Configure FIREBASE_SERVICE_ACCOUNT e FIREBASE_STORAGE_BUCKET no arquivo .env');
            return { db: null, storage: null };
        }

        // Parse do JSON das credenciais
        const serviceAccount = JSON.parse(serviceAccountJson);

        console.log('[FIREBASE] 📂 Carregando credenciais do .env');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket
        });

        db = admin.firestore();
        storage = admin.storage().bucket();
        initialized = true;

        console.log('[FIREBASE] ✅ Inicializado com sucesso!');
        console.log(`[FIREBASE] 📦 Projeto: ${serviceAccount.project_id}`);
        console.log(`[FIREBASE] 🗄️  Storage Bucket: ${storageBucket}`);
        return { db, storage };

    } catch (error) {
        console.error('[FIREBASE] ❌ Erro ao inicializar:', error.message);
        console.error('[FIREBASE] 💡 Verifique se as credenciais no .env estão corretas');
        return { db: null, storage: null };
    }
}

/**
 * Salva imagem no Firestore
 */
async function saveImageToFirestore(data) {
    const { db } = initializeFirebase();
    if (!db) {
        throw new Error('Firebase não inicializado');
    }

    const docRef = await db.collection('Imagens').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return docRef.id;
}

/**
 * Busca imagem no Firestore por nome normalizado
 */
async function findImageInFirestore(normalizedName) {
    const { db } = initializeFirebase();
    if (!db) {
        return null;
    }

    const snapshot = await db.collection('Imagens')
        .where('normalizedName', '==', normalizedName)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data()
    };
}

/**
 * Upload de imagem para o Storage
 */
async function uploadImageToStorage(imageBuffer, fileName) {
    const { storage } = initializeFirebase();
    if (!storage) {
        throw new Error('Firebase Storage não inicializado');
    }

    const file = storage.file(`vehicles/${fileName}`);
    
    await file.save(imageBuffer, {
        metadata: {
            contentType: 'image/jpeg',
        },
        public: true
    });

    // Retorna URL pública
    const publicUrl = `https://storage.googleapis.com/${storage.name}/vehicles/${fileName}`;
    return publicUrl;
}

module.exports = {
    initializeFirebase,
    saveImageToFirestore,
    findImageInFirestore,
    uploadImageToStorage
};
