import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

  // --- Customer Management ---
  fetchAllCustomers: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/customers`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to fetch customers.');
    }
  },
  resetCustomerPassword: async (customerId, password) => {
    try {
      const response = await axios.put(`${API_URL}/users/customers/${customerId}/reset-password`, { password }, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to reset customer password.');
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
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  },
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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
  uploadImage: async (file, category) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    try {
      const response = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleError(error, 'File upload failed.');
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
  // ADMIN & EMPLOYEE FUNCTIONS
  // ===============================================

    // --- ADDED Car Management Functions ---
  createCar: async (carData) => {
    try {
      const response = await axios.post(`${API_URL}/cars`, carData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to create car.');
    }
  },
  updateCar: async (id, carData) => {
    try {
      const response = await axios.put(`${API_URL}/cars/${id}`, carData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to update car.');
    }
  },
  archiveCar: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/cars/${id}/archive`, {}, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to archive car.');
    }
  },

  // --- ADDED Tour Management Functions ---
  createTour: async (tourData) => {
    try {
      const response = await axios.post(`${API_URL}/tours`, tourData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to create tour.');
    }
  },
  updateTour: async (id, tourData) => {
    try {
      const response = await axios.put(`${API_URL}/tours/${id}`, tourData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to update tour.');
    }
  },
  archiveTour: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/tours/${id}/archive`, {}, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error, 'Failed to archive tour.');
    }
  },

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
  fetchAllReviews: async () => {
    try {
        const response = await axios.get(`${API_URL}/reviews`, { headers: getAuthHeader() });
        return response.data;
    } catch(error) {
        return handleError(error, 'Failed to fetch all reviews.');
    }
  },
  approveReview: async (id) => {
      try {
          const response = await axios.put(`${API_URL}/reviews/${id}/approve`, {}, { headers: getAuthHeader() });
          return response.data;
      } catch(error) {
          return handleError(error, 'Failed to approve review.');
      }
  },
  deleteReview: async (id) => {
      try {
          const response = await axios.delete(`${API_URL}/reviews/${id}`, { headers: getAuthHeader() });
          return response.data;
      } catch(error) {
          return handleError(error, 'Failed to delete review.');
      }
  }
};

export default DataService;