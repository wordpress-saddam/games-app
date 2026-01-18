import config from '../config';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('admin_token');
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('admin_token', token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('admin_token');
};

// API request helper
const apiRequest = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // If no token and this is not an auth endpoint, throw a clear error
    if (!url.includes('/auth/')) {
      throw new Error('Authentication required. Please log in to continue.');
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 403 Forbidden specifically
    if (response.status === 403) {
      // Try to parse error message if available
      let errorMessage = 'Access forbidden. Please check your authentication token.';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error?.message || data.error?.msg || errorMessage;
        }
      } catch (e) {
        // If parsing fails, use default message
      }
      const error = new Error(errorMessage);
      error.status = 403;
      error.errorCode = 403;
      // If 403, likely token issue - remove invalid token
      if (token) {
        removeToken();
      }
      throw error;
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text}`);
    }

    // Check if response indicates an error (backend returns status: false for errors)
    if (!response.ok || (data.status === false)) {
      const errorMessage = data.error?.message || data.error?.msg || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.errorCode = data.error?.errorCode;
      error.status = response.status;
      
      // Handle authentication errors - remove token if invalid/expired
      if (response.status === 401 || data.error?.errorCode === 208 || data.error?.errorCode === 209) {
        removeToken();
        error.message = 'Your session has expired. Please log in again.';
      }
      
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (email, password, name) => {
    try {
      const response = await apiRequest(config.endpoints.auth.register, {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      });
      if (response.data?.token) {
        setToken(response.data.token);
      }
      return response;
    } catch (error) {
      // Re-throw with error code for better error handling
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiRequest(config.endpoints.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (response.data?.token) {
        setToken(response.data.token);
      }
      return response;
    } catch (error) {
      // Re-throw with error code for better error handling
      throw error;
    }
  },

  getCurrentUser: async () => {
    return apiRequest(config.endpoints.auth.me);
  },

  logout: () => {
    removeToken();
  }
};

// Feeds API
export const feedsAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams({
      offset: params.offset || 0,
      limit: params.limit || 10,
      ...params
    }).toString();
    return apiRequest(`${config.endpoints.feeds.list}?${queryString}`);
  },

  create: async (feedData) => {
    return apiRequest(config.endpoints.feeds.create, {
      method: 'POST',
      body: JSON.stringify(feedData)
    });
  },

  get: async (id) => {
    return apiRequest(config.endpoints.feeds.get(id));
  },

  update: async (id, feedData) => {
    return apiRequest(config.endpoints.feeds.update(id), {
      method: 'PUT',
      body: JSON.stringify(feedData)
    });
  },

  delete: async (id) => {
    return apiRequest(config.endpoints.feeds.delete(id), {
      method: 'DELETE'
    });
  },

  restore: async (id) => {
    return apiRequest(config.endpoints.feeds.restore(id), {
      method: 'POST'
    });
  },

  test: async (url) => {
    return apiRequest(`${config.endpoints.feeds.list}/test`, {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }
};

// Feed Articles API
export const feedArticlesAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams({
      offset: params.offset || 0,
      limit: params.limit || 10,
      ...params
    }).toString();
    return apiRequest(`${config.endpoints.feedArticles.list}?${queryString}`);
  },

  get: async (id) => {
    return apiRequest(config.endpoints.feedArticles.get(id));
  },

  updateStatus: async (id, status) => {
    return apiRequest(config.endpoints.feedArticles.updateStatus(id), {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  delete: async (id) => {
    return apiRequest(config.endpoints.feedArticles.delete(id), {
      method: 'DELETE'
    });
  }
};

// Settings API
export const settingsAPI = {
  get: async (feedId) => {
    const queryString = feedId ? `?feedId=${feedId}` : '';
    return apiRequest(`${config.endpoints.settings.get}${queryString}`);
  },

  update: async (settingsData) => {
    return apiRequest(config.endpoints.settings.update, {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  },

  getGlobal: async () => {
    return apiRequest(config.endpoints.settings.global);
  }
};

// Import API
export const importAPI = {
    importFeed: async (feedId) => {
        return apiRequest(config.endpoints.import.importFeed(feedId), {
            method: 'POST'
        });
    },

    importAll: async () => {
        return apiRequest(config.endpoints.import.importAll, {
            method: 'POST'
        });
    },

    getHistory: async (params = {}) => {
        const queryString = new URLSearchParams({
            offset: params.offset || 0,
            limit: params.limit || 10,
            ...params
        }).toString();
        return apiRequest(`${config.endpoints.import.history}?${queryString}`);
    }
};

// Game Settings API
export const gameSettingsAPI = {
    list: async (params = {}) => {
        const queryString = new URLSearchParams({
            offset: params.offset || 0,
            limit: params.limit || 10,
            ...params
        }).toString();
        return apiRequest(`${config.endpoints.gameSettings.list}?${queryString}`);
    },

    get: async (feedId) => {
        return apiRequest(config.endpoints.gameSettings.get(feedId));
    },

    createOrUpdate: async (settingsData) => {
        return apiRequest(config.endpoints.gameSettings.createOrUpdate, {
            method: 'POST',
            body: JSON.stringify(settingsData)
        });
    },

    delete: async (feedId) => {
        return apiRequest(config.endpoints.gameSettings.delete(feedId), {
            method: 'DELETE'
        });
    }
};

