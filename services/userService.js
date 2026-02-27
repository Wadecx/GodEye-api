require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Vérifier que JWT_SECRET est défini
if (!process.env.JWT_SECRET) {
  console.error('ERREUR CRITIQUE: JWT_SECRET non défini dans .env');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12; // Augmenté pour plus de sécurité
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../src/database.db');

let db = null;

// Initialiser la base de donnees
async function initDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Charger la base existante ou en creer une nouvelle
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Creer la table users si elle n'existe pas
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
  return db;
}

// Sauvegarder la base de donnees
function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper pour executer une requete avec parametres
function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

const userService = {
  async register(name, email, password) {
    await initDB();

    // Verifier si l'utilisateur existe deja
    const existingUser = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe deja');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const now = new Date().toISOString();

    // Creer l'utilisateur
    db.run('INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, now, now]);
    saveDB();

    // Recuperer l'ID du nouvel utilisateur
    const newUser = queryOne('SELECT last_insert_rowid() as id');
    const id = newUser.id;

    return {
      id,
      name,
      email,
      created_at: now
    };
  },

  async login(email, password) {
    await initDB();

    // Trouver l'utilisateur
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Verifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Generer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner l'utilisateur et le token
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  },

  async findById(id) {
    await initDB();

    const user = queryOne('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?', [id]);
    return user || null;
  }
};

module.exports = userService;
