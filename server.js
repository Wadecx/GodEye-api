require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Import des routes
const userRoutes = require('./routes/userRoutes');
const oathnetRoutes = require('./routes/oathnetRoutes');

// ============================================
// SECURITE - Helmet (headers HTTP sécurisés)
// ============================================
app.use(helmet());

// ============================================
// SECURITE - CORS configuré
// ============================================
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://votre-domaine.com'] // Remplacer par ton domaine en prod
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ============================================
// SECURITE - Rate Limiting global
// ============================================
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting strict pour l'authentification (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
  },
  skipSuccessfulRequests: true, // Ne compte pas les requêtes réussies
});

// Rate limiting pour les recherches OSINT (API coûteuse)
const osintLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes par minute
  message: {
    success: false,
    message: 'Limite de recherches atteinte. Réessayez dans une minute.'
  },
});

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json({ limit: '10kb' })); // Limite la taille des requêtes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// ROUTES
// ============================================

// Route principale
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GodEye API',
    version: '1.0.0'
  });
});

// Routes authentification avec rate limiting strict
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users', userRoutes);

// Routes OSINT avec rate limiting
app.use('/api/osint', osintLimiter, oathnetRoutes);

// ============================================
// GESTION DES ERREURS
// ============================================

// 404 - Route non trouvée
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📦 Mode: ${process.env.NODE_ENV || 'development'}`);
});
