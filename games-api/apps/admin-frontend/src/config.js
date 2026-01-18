// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5007/api/admin';

export const config = {
  API_BASE_URL,
  endpoints: {
    auth: {
      register: `${API_BASE_URL}/auth/register`,
      login: `${API_BASE_URL}/auth/login`,
      me: `${API_BASE_URL}/auth/me`
    },
    feeds: {
      list: `${API_BASE_URL}/feeds`,
      create: `${API_BASE_URL}/feeds`,
      get: (id) => `${API_BASE_URL}/feeds/${id}`,
      update: (id) => `${API_BASE_URL}/feeds/${id}`,
      delete: (id) => `${API_BASE_URL}/feeds/${id}`,
      restore: (id) => `${API_BASE_URL}/feeds/${id}/restore`,
      test: `${API_BASE_URL}/feeds/test`,
      testById: (id) => `${API_BASE_URL}/feeds/${id}/test`
    },
    feedArticles: {
      list: `${API_BASE_URL}/feedarticles`,
      get: (id) => `${API_BASE_URL}/feedarticles/${id}`,
      updateStatus: (id) => `${API_BASE_URL}/feedarticles/${id}/status`,
      delete: (id) => `${API_BASE_URL}/feedarticles/${id}`
    },
    settings: {
      get: `${API_BASE_URL}/settings`,
      update: `${API_BASE_URL}/settings`,
      global: `${API_BASE_URL}/settings/global`
    },
    import: {
      importFeed: (feedId) => `${API_BASE_URL}/import/feed/${feedId}`,
      importAll: `${API_BASE_URL}/import/all`,
      history: `${API_BASE_URL}/import/history`
    },
    gameSettings: {
      list: `${API_BASE_URL}/game-settings`,
      get: (feedId) => `${API_BASE_URL}/game-settings/feed/${feedId}`,
      createOrUpdate: `${API_BASE_URL}/game-settings`,
      delete: (feedId) => `${API_BASE_URL}/game-settings/feed/${feedId}`
    }
  }
};

export default config;

