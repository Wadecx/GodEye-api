const userService = require('../services/userService');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Format de token invalide'
      });
    }

    const decoded = userService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expire'
    });
  }
};

module.exports = authMiddleware;
