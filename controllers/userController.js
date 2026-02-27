const validator = require('validator');
const userService = require('../services/userService');

// Sanitize les entrées pour éviter XSS
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return validator.escape(validator.trim(str));
}

const userController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validation des champs requis
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nom, email et mot de passe sont requis'
        });
      }

      // Sanitize le nom
      const sanitizedName = sanitize(name);
      if (sanitizedName.length < 2 || sanitizedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Le nom doit contenir entre 2 et 50 caractères'
        });
      }

      // Validation email
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      // Normaliser l'email (minuscules, trim)
      const normalizedEmail = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false
      });

      // Validation mot de passe fort
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins une majuscule'
        });
      }

      if (!/[a-z]/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins une minuscule'
        });
      }

      if (!/[0-9]/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins un chiffre'
        });
      }

      const user = await userService.register(sanitizedName, normalizedEmail, password);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation des champs requis
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont requis'
        });
      }

      // Validation email
      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      const normalizedEmail = validator.normalizeEmail(email, {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false
      });

      const result = await userService.login(normalizedEmail, password);

      res.status(200).json({
        success: true,
        message: result.token,
        data: result
      });
    } catch (error) {
      // Message générique pour ne pas révéler si l'email existe
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await userService.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
};

module.exports = userController;
