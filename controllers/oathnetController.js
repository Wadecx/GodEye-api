const oathnetService = require('../services/oathnetService');
const userService = require('../services/userService');

const oathnetController = {
  // IP Geolocation
  async ipInfo(req, res) {
    try {
      const { ip } = req.query;
      if (!ip) {
        return res.status(400).json({ success: false, message: 'IP requise' });
      }
      const result = await oathnetService.ipInfo(ip);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Email lookup (Holehe)
  async holehe(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email requis' });
      }
      const result = await oathnetService.holehe(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Google Account (GHunt)
  async ghunt(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email Gmail requis' });
      }
      const result = await oathnetService.ghunt(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Steam Profile
  async steam(req, res) {
    try {
      const { steam_id } = req.query;
      if (!steam_id) {
        return res.status(400).json({ success: false, message: 'Steam ID requis' });
      }
      const result = await oathnetService.steam(steam_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Xbox Profile
  async xbox(req, res) {
    try {
      const { xbl_id } = req.query;
      if (!xbl_id) {
        return res.status(400).json({ success: false, message: 'Xbox ID ou Gamertag requis' });
      }
      const result = await oathnetService.xbox(xbl_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Roblox Profile
  async roblox(req, res) {
    try {
      const { user_id, username } = req.query;
      if (!user_id && !username) {
        return res.status(400).json({ success: false, message: 'User ID ou Username requis' });
      }
      const result = await oathnetService.roblox(user_id, username);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Discord User Info
  async discordUserInfo(req, res) {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ success: false, message: 'Discord User ID requis' });
      }
      const result = await oathnetService.discordUserInfo(user_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Discord Username History
  async discordUsernameHistory(req, res) {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ success: false, message: 'Discord User ID requis' });
      }
      const result = await oathnetService.discordUsernameHistory(user_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Discord to Roblox
  async discordToRoblox(req, res) {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ success: false, message: 'Discord User ID requis' });
      }
      const result = await oathnetService.discordToRoblox(user_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Minecraft Username History
  async minecraftHistory(req, res) {
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ success: false, message: 'Username Minecraft requis' });
      }
      const result = await oathnetService.minecraftHistory(username);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Search Breach Database
  async searchBreach(req, res) {
    try {
      const { q, cursor, dbnames } = req.query;
      if (!q) {
        return res.status(400).json({ success: false, message: 'Parametre q (query) requis' });
      }
      const result = await oathnetService.searchBreach(q, cursor, dbnames);

      // Incrémenter le compteur si l'utilisateur n'est pas admin
      if (req.user && req.quota && req.quota.remaining !== 'illimité') {
        await userService.incrementSearchCount(req.user.id);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Search Stealer Logs
  async searchStealer(req, res) {
    try {
      const { query, type } = req.query;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Query requise' });
      }
      const result = await oathnetService.searchStealer(query, type || 'email');

      // Incrémenter le compteur si l'utilisateur n'est pas admin
      if (req.user && req.quota && req.quota.remaining !== 'illimité') {
        await userService.incrementSearchCount(req.user.id);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Search Stealer V2
  async searchStealerV2(req, res) {
    try {
      const { query, type, page } = req.query;
      if (!query) {
        return res.status(400).json({ success: false, message: 'Query requise' });
      }
      const result = await oathnetService.searchStealerV2(query, type || 'email', page || 1);

      // Incrémenter le compteur si l'utilisateur n'est pas admin
      if (req.user && req.quota && req.quota.remaining !== 'illimité') {
        await userService.incrementSearchCount(req.user.id);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Extract Subdomain
  async extractSubdomain(req, res) {
    try {
      const { domain } = req.query;
      if (!domain) {
        return res.status(400).json({ success: false, message: 'Domain requis' });
      }
      const result = await oathnetService.extractSubdomain(domain);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = oathnetController;
