require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Vérifier que JWT_SECRET est défini
if (!process.env.JWT_SECRET) {
  console.error('ERREUR CRITIQUE: JWT_SECRET non défini dans .env');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('ERREUR CRITIQUE: DATABASE_URL non défini dans .env');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// Pool de connexions PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialiser la base de données
async function initDB() {
  const client = await pool.connect();
  try {
    // Créer la table users si elle n'existe pas
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        search_count INTEGER DEFAULT 0,
        max_searches INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Base de données initialisée');
  } finally {
    client.release();
  }
}

// Initialiser au démarrage
initDB().catch(err => {
  console.error('Erreur initialisation DB:', err);
});

const userService = {
  async register(name, email, password) {
    const client = await pool.connect();
    try {
      // Vérifier si l'utilisateur existe déjà
      const existing = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const now = new Date().toISOString();

      // Créer l'utilisateur
      const result = await client.query(
        'INSERT INTO users (name, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, created_at',
        [name, email, hashedPassword, now, now]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  },

  async login(email, password) {
    const client = await pool.connect();
    try {
      // Trouver l'utilisateur
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer le token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Retourner l'utilisateur sans le mot de passe
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } finally {
      client.release();
    }
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  },

  async findById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, email, role, search_count, max_searches, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Vérifier si l'utilisateur peut faire une recherche
  async canSearch(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT role, search_count, max_searches FROM users WHERE id = $1',
        [userId]
      );
      const user = result.rows[0];

      if (!user) return { allowed: false, reason: 'Utilisateur non trouvé' };

      // Les admins ont des recherches illimitées
      if (user.role === 'admin') {
        return { allowed: true, remaining: 'illimité' };
      }

      // Vérifier le quota
      if (user.search_count >= user.max_searches) {
        return {
          allowed: false,
          reason: 'Quota de recherches atteint. Passez à un abonnement premium.',
          used: user.search_count,
          max: user.max_searches
        };
      }

      return {
        allowed: true,
        remaining: user.max_searches - user.search_count,
        used: user.search_count,
        max: user.max_searches
      };
    } finally {
      client.release();
    }
  },

  // Incrémenter le compteur de recherches
  async incrementSearchCount(userId) {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET search_count = search_count + 1, updated_at = $1 WHERE id = $2',
        [new Date().toISOString(), userId]
      );
    } finally {
      client.release();
    }
  },

  // Mettre à jour le rôle d'un utilisateur (admin only)
  async updateRole(userId, newRole) {
    if (!['user', 'admin', 'premium'].includes(newRole)) {
      throw new Error('Rôle invalide');
    }
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET role = $1, updated_at = $2 WHERE id = $3',
        [newRole, new Date().toISOString(), userId]
      );
    } finally {
      client.release();
    }
  },

  // Mettre à jour le quota de recherches (pour les abonnements)
  async updateMaxSearches(userId, maxSearches) {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET max_searches = $1, updated_at = $2 WHERE id = $3',
        [maxSearches, new Date().toISOString(), userId]
      );
    } finally {
      client.release();
    }
  },

  // Reset le compteur de recherches (pour un nouveau mois par exemple)
  async resetSearchCount(userId) {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET search_count = 0, updated_at = $1 WHERE id = $2',
        [new Date().toISOString(), userId]
      );
    } finally {
      client.release();
    }
  }
};

module.exports = userService;
