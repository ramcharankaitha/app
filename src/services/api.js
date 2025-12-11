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

    // Check if response is ok before trying to parse JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `API request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    // If it's a network error, provide a more helpful message
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
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

// Stores API
export const storesAPI = {
  getAll: async () => {
    return apiCall('/stores');
  },
  getById: async (id) => {
    return apiCall(`/stores/${id}`);
  },
};

// Permissions API
export const permissionsAPI = {
  getAll: async () => {
    return apiCall('/permissions');
  },
  getByRole: async (roleName) => {
    return apiCall(`/permissions/${roleName}`);
  },
  update: async (roleName, permissions) => {
    return apiCall(`/permissions/${roleName}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },
};

// Export API
export const exportAPI = {
  getAll: async () => {
    return apiCall('/export/all');
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
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/profile/upload-avatar`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      // Check if response is ok before trying to parse JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      return data;
    } catch (error) {
      console.error('Avatar upload error:', error);
      // If it's a network error, provide a more helpful message
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('Network error: Could not connect to server. Please check if the server is running.');
      }
      throw error;
    }
  },
  changePassword: async (currentPassword, newPassword) => {
    return apiCall('/profile', {
      method: 'PUT',
      body: JSON.stringify({
        password: newPassword,
        currentPassword: currentPassword
      }),
    });
  },
};

export default {
  authAPI,
  usersAPI,
  staffAPI,
  productsAPI,
  storesAPI,
  permissionsAPI,
  exportAPI,
  profileAPI,
};

