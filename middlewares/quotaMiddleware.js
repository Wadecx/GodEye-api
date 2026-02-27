const userService = require('../services/userService');

// Middleware pour vérifier le quota de recherches
const checkSearchQuota = async (req, res, next) => {
  try {
    // L'utilisateur doit être authentifié (authMiddleware doit être appelé avant)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const result = await userService.canSearch(req.user.id);

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        message: result.reason,
        quota: {
          used: result.used,
          max: result.max
        }
      });
    }

    // Ajouter les infos de quota à la requête pour utilisation ultérieure
    req.quota = result;
    next();
  } catch (error) {
    console.error('Erreur vérification quota:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du quota'
    });
  }
};

// Middleware pour incrémenter le compteur après une recherche réussie
const incrementSearchCount = async (req, res, next) => {
  // On incrémente seulement si l'utilisateur n'est pas admin
  if (req.user && req.quota && req.quota.remaining !== 'illimité') {
    try {
      await userService.incrementSearchCount(req.user.id);
    } catch (error) {
      console.error('Erreur incrémentation compteur:', error);
    }
  }
  next();
};

// Middleware admin only
const adminOnly = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const user = await userService.findById(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

module.exports = {
  checkSearchQuota,
  incrementSearchCount,
  adminOnly
};
