// Require an explicit API base URL in deployed environments to avoid falling back to localhost
const getApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, ''); // strip trailing slashes
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REACT_APP_API_URL is not set. Please configure it in your deployment environment.');
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

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
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Network error: Could not connect to server. Please check if the server is running.');
    }
    throw error;
  }
};

export const authAPI = {
  login: async (identifier, password, role) => {
    const payload = role === 'admin' 
      ? { email: identifier, password }
      : { username: identifier, password };
    
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

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

export const staffAPI = {
  getAll: async () => {
    return apiCall('/staff');
  },
  getById: async (id) => {
    return apiCall(`/staff/${id}`);
  },
  create: async (staffData) => {
    return apiCall('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },
};

export const productsAPI = {
  getAll: async () => {
    return apiCall('/products');
  },
  getById: async (id) => {
    return apiCall(`/products/${id}`);
  },
  getByItemCode: async (itemCode) => {
    return apiCall(`/products/item-code/${encodeURIComponent(itemCode)}`);
  },
  create: async (productData) => {
    return apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  update: async (id, productData) => {
    return apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  delete: async (id) => {
    return apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

export const storesAPI = {
  getAll: async () => {
    return apiCall('/stores');
  },
  getById: async (id) => {
    return apiCall(`/stores/${id}`);
  },
};

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

export const customersAPI = {
  getAll: async () => {
    return apiCall('/customers');
  },
  getById: async (id) => {
    return apiCall(`/customers/${id}`);
  },
  getTokens: async (phone, email) => {
    return apiCall(`/customers/tokens?phone=${encodeURIComponent(phone || '')}&email=${encodeURIComponent(email || '')}`);
  },
  create: async (customerData) => {
    return apiCall('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },
  update: async (id, customerData) => {
    return apiCall(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },
  delete: async (id) => {
    return apiCall(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

export const exportAPI = {
  getAll: async () => {
    return apiCall('/export/all');
  },
  getSales: async () => {
    return apiCall('/export/sales');
  },
};

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
      });

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

export const suppliersAPI = {
  getAll: async () => {
    return apiCall('/suppliers');
  },
  getById: async (id) => {
    return apiCall(`/suppliers/${id}`);
  },
  create: async (supplierData) => {
    return apiCall('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },
  update: async (id, supplierData) => {
    return apiCall(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },
  delete: async (id) => {
    return apiCall(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  },
};

export const chitPlansAPI = {
  getPlans: async () => {
    return apiCall('/chit-plans/plans');
  },
  getPlanById: async (id) => {
    return apiCall(`/chit-plans/plans/${id}`);
  },
  getCustomers: async () => {
    return apiCall('/chit-plans/customers');
  },
  getCustomerById: async (id) => {
    return apiCall(`/chit-plans/customers/${id}`);
  },
  createCustomer: async (customerData) => {
    return apiCall('/chit-plans/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },
  updateCustomer: async (id, customerData) => {
    return apiCall(`/chit-plans/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  },
  deleteCustomer: async (id) => {
    return apiCall(`/chit-plans/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

export const dispatchAPI = {
  getAll: async () => {
    return apiCall('/dispatch');
  },
  getById: async (id) => {
    return apiCall(`/dispatch/${id}`);
  },
  create: async (dispatchData) => {
    return apiCall('/dispatch', {
      method: 'POST',
      body: JSON.stringify(dispatchData),
    });
  },
  update: async (id, dispatchData) => {
    return apiCall(`/dispatch/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dispatchData),
    });
  },
  delete: async (id) => {
    return apiCall(`/dispatch/${id}`, {
      method: 'DELETE',
    });
  },
};

export const transportAPI = {
  getAll: async () => {
    return apiCall('/transport');
  },
  getById: async (id) => {
    return apiCall(`/transport/${id}`);
  },
  create: async (transportData) => {
    return apiCall('/transport', {
      method: 'POST',
      body: JSON.stringify(transportData),
    });
  },
  update: async (id, transportData) => {
    return apiCall(`/transport/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transportData),
    });
  },
  delete: async (id) => {
    return apiCall(`/transport/${id}`, {
      method: 'DELETE',
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
  customersAPI,
  profileAPI,
  suppliersAPI,
  chitPlansAPI,
  dispatchAPI,
  transportAPI,
};

