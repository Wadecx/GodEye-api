const express = require('express');
const router = express.Router();
const oathnetController = require('../controllers/oathnetController');
const authMiddleware = require('../middlewares/authMiddleware');

// Toutes les routes sont protegees par authentification
router.use(authMiddleware);

// OSINT - Network
router.get('/ip-info', oathnetController.ipInfo);
router.get('/subdomain', oathnetController.extractSubdomain);

// OSINT - Email
router.get('/holehe', oathnetController.holehe);
router.get('/ghunt', oathnetController.ghunt);

// Gaming
router.get('/steam', oathnetController.steam);
router.get('/xbox', oathnetController.xbox);
router.get('/roblox', oathnetController.roblox);
router.get('/minecraft', oathnetController.minecraftHistory);

// Discord
router.get('/discord/user', oathnetController.discordUserInfo);
router.get('/discord/history', oathnetController.discordUsernameHistory);
router.get('/discord/roblox', oathnetController.discordToRoblox);

// Search - Breach & Stealer
router.get('/search/breach', oathnetController.searchBreach);
router.get('/search/stealer', oathnetController.searchStealer);
router.get('/search/stealer-v2', oathnetController.searchStealerV2);

module.exports = router;
