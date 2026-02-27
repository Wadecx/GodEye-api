require('dotenv').config();

// Vérifier que la clé API est définie
if (!process.env.OATHNET_API_KEY) {
  console.error('ERREUR CRITIQUE: OATHNET_API_KEY non défini dans .env');
  process.exit(1);
}

const OATHNET_API_KEY = process.env.OATHNET_API_KEY;
const BASE_URL = 'https://oathnet.org/api/service';

async function makeRequest(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': OATHNET_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data;
}

const oathnetService = {
  // OSINT - IP Geolocation
  async ipInfo(ip) {
    return makeRequest('/ip-info', { ip });
  },

  // OSINT - Email lookup (Holehe)
  async holehe(email) {
    return makeRequest('/holehe', { email });
  },

  // OSINT - Google Account (GHunt)
  async ghunt(email) {
    return makeRequest('/ghunt', { email });
  },

  // Gaming - Steam Profile
  async steam(steamId) {
    return makeRequest('/steam', { steam_id: steamId });
  },

  // Gaming - Xbox Profile
  async xbox(xblId) {
    return makeRequest('/xbox', { xbl_id: xblId });
  },

  // Gaming - Roblox Profile
  async roblox(userId, username) {
    const params = {};
    if (userId) params.user_id = userId;
    if (username) params.username = username;
    return makeRequest('/roblox-userinfo', params);
  },

  // Discord - User Info
  async discordUserInfo(userId) {
    return makeRequest('/discord-userinfo', { user_id: userId });
  },

  // Discord - Username History
  async discordUsernameHistory(userId) {
    return makeRequest('/username-history', { user_id: userId });
  },

  // Discord to Roblox
  async discordToRoblox(userId) {
    return makeRequest('/discord-to-roblox', { user_id: userId });
  },

  // Minecraft - Username History
  async minecraftHistory(username) {
    return makeRequest('/mc-history', { username });
  },

  // Search - Breach Database
  async searchBreach(q, cursor, dbnames) {
    const params = { q };
    if (cursor) params.cursor = cursor;
    if (dbnames) params.dbnames = dbnames;
    return makeRequest('/search-breach', params);
  },

  // Search - Stealer Logs
  async searchStealer(query, type = 'email') {
    return makeRequest('/search-stealer', { query, type });
  },

  // Search - Stealer V2 (advanced)
  async searchStealerV2(query, type = 'email', page = 1) {
    return makeRequest('/v2/stealer/search', { query, type, page });
  },

  // Subdomain extraction
  async extractSubdomain(domain) {
    return makeRequest('/extract-subdomain', { domain });
  }
};

module.exports = oathnetService;
