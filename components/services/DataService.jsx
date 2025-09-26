import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Retrieves the authentication token from localStorage.
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * A centralized error handler for API calls.
 */
const handleError = (error, defaultMessage = 'An unknown error occurred.') => {
  console.error('API Call Failed:', error);
  const message = error.response?.data?.message || error.message || defaultMessage;
  return { success: false, data: null, message };
};

const DataService = {
  // --- Health Check ---
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return handleError(error, 'Server health check failed.');
    }
  },

  // --- Authentication & User Account ---
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed.');
    }
  },
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      if (response.data.token) {
        // --- ENSURE token is set before returning ---
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // --- REMOVED automatic logout on failed login for better user experience ---
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  updateUserProfile: async (userData) => {
    try {
        const response = await axios.put(`${API_URL}/users/profile`, userData, { headers: getAuthHeader() });
        return response.data;
    } catch (error) {
        return handleError(error, 'Failed to update profile.');
    }
  },
  changePassword: async (passwordData) => {
      try {
          const response = await axios.put(`${API_URL}/users/change-password`, passwordData, { headers: getAuthHeader() });
          return response.data;
      } catch (error) {
          return handleError(error, 'Failed to change password.');
      }
  },

  // --- File Upload ---
  uploadPaymentProof: async (bookingId, file) => {
    const formData = new FormData();
    formData.append('paymentProof', file);
    try {
      const response = await axios.post(`${API_URL}/bookings/${bookingId}/payment-proof`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error, 'Payment proof upload failed.');
    }
  },
  
  // --- Cars & Tours (Public) ---
  fetchAllCars: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/cars`, { params: filters });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  fetchAllTours: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/tours`, { params: filters });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // --- Bookings ---
  createBooking: async (bookingData) => {
    // This supports both guest and registered user bookings
    try {
      const response = await axios.post(`${API_URL}/bookings`, bookingData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to create booking.');
    }
  },
  fetchUserBookings: async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings/my-bookings`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // --- Reviews/Feedback ---
  submitFeedback: async (feedbackData) => {
    try {
      const response = await axios.post(`${API_URL}/reviews`, feedbackData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to submit feedback.');
    }
  },
  getMyReviews: async () => {
      try {
          const response = await axios.get(`${API_URL}/reviews/my-reviews`, { headers: getAuthHeader() });
          return response.data;
      } catch (error) {
          return handleError(error, 'Failed to fetch your reviews.');
      }
  },
  
  // ===============================================
  // ADMIN & EMPLOYEE FUNCTIONS (for completeness)
  // ===============================================

  fetchAllMessages: async () => {
    try {
        const response = await axios.get(`${API_URL}/messages`, { headers: getAuthHeader() });
        return response.data;
    } catch (error) {
        return handleError(error, 'Failed to fetch messages.');
    }
  },

  fetchAllEmployees: async () => {
      try {
          const response = await axios.get(`${API_URL}/users/employees`, { headers: getAuthHeader() });
          return response.data;
      } catch (error) {
          return handleError(error, 'Failed to fetch employees.');
      }
  },
  
  // --- ADDED Employee Management Functions ---
  createEmployee: async (employeeData) => {
    try {
      const response = await axios.post(`${API_URL}/users/employees`, employeeData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to create employee.');
    }
  },

  updateEmployee: async (id, employeeData) => {
    try {
      const response = await axios.put(`${API_URL}/users/employees/${id}`, employeeData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to update employee.');
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/users/employees/${id}`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to delete employee.');
    }
  },
  
  fetchAllBookings: async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  updateBookingStatus: async (id, status, adminNotes) => {
    try {
      const response = await axios.put(`${API_URL}/bookings/${id}/status`, { status, adminNotes }, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  fetchDashboardAnalytics: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  fetchContent: async (type) => {
    try {
      const response = await axios.get(`${API_URL}/content/${type}`);
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to fetch '${type}' content.`);
    }
  },
  updateContent: async (type, contentData) => {
    try {
      const response = await axios.put(`${API_URL}/content/${type}`, contentData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, `Failed to update '${type}' content.`);
    }
  },
};

export default DataService;