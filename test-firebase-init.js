require('dotenv').config();
const { initializeFirebase } = require('./services/firebaseService');

console.log('🧪 Testando inicialização do Firebase...\n');

const { db, storage } = initializeFirebase();

if (db && storage) {
    console.log('\n✅ Firebase inicializado com sucesso!');
    console.log('✅ Firestore disponível');
    console.log('✅ Storage disponível');
    process.exit(0);
} else {
    console.log('\n❌ Falha na inicialização do Firebase');
    process.exit(1);
}
