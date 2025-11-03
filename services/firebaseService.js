const admin = require('firebase-admin');

let db = null;
let storage = null;
let initialized = false;

/**
 * Inicializa o Firebase Admin SDK
 */
function initializeFirebase() {
    if (initialized) {
        return { db, storage };
    }

    try {
        // Verifica se as credenciais estão disponíveis
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : null;

        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

        if (!serviceAccount || !storageBucket) {
            console.warn('[FIREBASE] ⚠️  Credenciais não configuradas. Firebase desabilitado.');
            return { db: null, storage: null };
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket
        });

        db = admin.firestore();
        storage = admin.storage().bucket();
        initialized = true;

        console.log('[FIREBASE] ✅ Inicializado com sucesso');
        return { db, storage };

    } catch (error) {
        console.error('[FIREBASE] ❌ Erro ao inicializar:', error.message);
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
