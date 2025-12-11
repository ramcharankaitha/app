const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (identifier, password, role) => {
    // For admin: send email, for manager/staff: send username
    const payload = role === 'admin' 
      ? { email: identifier, password }
      : { username: identifier, password };
    
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiCall('/users');
  },
  getById: async (id) => {
    return apiCall(`/users/${id}`);
  },
  create: async (userData) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  update: async (id, userData) => {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  delete: async (id) => {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    return apiCall('/staff');
  },
  create: async (staffData) => {
    return apiCall('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },
};

// Products API
export const productsAPI = {
  getAll: async () => {
    return apiCall('/products');
  },
  create: async (productData) => {
    return apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
};

// Profile API
export const profileAPI = {
  get: async () => {
    return apiCall('/profile');
  },
  update: async (profileData) => {
    return apiCall('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

export default {
  authAPI,
  usersAPI,
  staffAPI,
  productsAPI,
  profileAPI,
};

