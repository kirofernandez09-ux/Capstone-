import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Retrieves the authentication token from localStorage.
 * This is a crucial helper function to ensure every protected API call is authenticated.
 * @returns {object} - The Authorization header object, or an empty object if no token is found.
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * A centralized error handler. It logs the error and returns a consistent,
 * safe object shape to prevent frontend components from crashing on API failures.
 * @param {Error} error - The error object from Axios.
 * @returns {object} - A standardized error response object.
 */
const handleError = (error) => {
  console.error('API Call Failed:', error);
  const message = error.response?.data?.message || error.message || 'An unknown error occurred. The server may be offline.';
  // Always return a consistent error shape to prevent components from crashing
  return { success: false, data: [], pagination: {}, message };
};

const DataService = {
  // --- Health Check ---
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // --- Authentication ---
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
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

  // --- File Upload ---
  uploadImage: async (file, category) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    try {
      const response = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          ...getAuthHeader(), // **FIX**: This correctly adds the auth token to uploads
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error; // Re-throw to be caught in the component
    }
  },

  // --- Cars ---
  fetchAllCars: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/cars`, { params: filters });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  createCar: async (carData) => {
    try {
      const response = await axios.post(`${API_URL}/cars`, carData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
  updateCar: async (id, carData) => {
    try {
      const response = await axios.put(`${API_URL}/cars/${id}`, carData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
  archiveCar: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/cars/${id}/archive`, {}, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // --- Tours ---
  fetchAllTours: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/tours`, { params: filters });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  createTour: async (tourData) => {
    try {
      const response = await axios.post(`${API_URL}/tours`, tourData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
  updateTour: async (id, tourData) => {
    try {
      const response = await axios.put(`${API_URL}/tours/${id}`, tourData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      handleError(error);
      throw error;
    }
  },
  archiveTour: async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/tours/${id}/archive`, {}, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // --- Bookings ---
  fetchAllBookings: async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  createBooking: async (bookingData) => {
    try {
      const response = await axios.post(`${API_URL}/bookings`, bookingData);
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

  // --- Employee Management ---
  fetchAllEmployees: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/employees`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  createEmployee: async (employeeData) => {
    try {
      const response = await axios.post(`${API_URL}/users/employees`, employeeData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  updateEmployee: async (id, employeeData) => {
    try {
      const response = await axios.put(`${API_URL}/users/employees/${id}`, employeeData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  deleteEmployee: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/users/employees/${id}`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
  changeEmployeePassword: async (id, password) => {
    try {
      const response = await axios.put(`${API_URL}/users/employees/${id}/password`, { password }, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // --- Analytics & Content ---
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
      return handleError(error);
    }
  },
  updateContent: async (type, contentData) => {
    try {
      const response = await axios.put(`${API_URL}/content/${type}`, contentData, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

export default DataService;