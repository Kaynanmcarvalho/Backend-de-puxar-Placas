require('dotenv').config();

const express = require('express');
const cors = require('cors');
const vehiclesRouter = require('./routes/vehicles');
const vehicleImagesRouter = require('./routes/vehicleImages');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configurado para aceitar requisições de QUALQUER origem
app.use(cors({
    origin: '*', // Aceita qualquer origem
    credentials: false, // Desabilita credentials quando origin é *
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-JSON'],
    maxAge: 86400 // Cache preflight por 24 horas
}));

// Handle OPTIONS requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`  Origin: ${req.headers.origin || 'none'}`);
    console.log(`  User-Agent: ${req.headers['user-agent'] || 'none'}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/vehicle-images', vehicleImagesRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Backend API Server Started');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🚗 Vehicle API: http://localhost:${PORT}/api/vehicles`);
    console.log(`🖼️  Vehicle Images API: http://localhost:${PORT}/api/vehicle-images`);
    console.log('='.repeat(50));
});

module.exports = app;
