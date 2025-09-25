class DataService {
  constructor() {
    this.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.MAX_RETRY_ATTEMPTS = 3;
    this.authToken = localStorage.getItem('token');
    this.isBackendAvailable = false;
    this.lastConnectionAttempt = null;
    this.connectionAttemptCooldown = 5000; // 5 seconds between connection attempts
    
    // Initialize with a connection check
    this._checkConnection();
  }

  // Private method to check connection to backend
  async _checkConnection() {
    const now = new Date().getTime();
    
    // Don't check too frequently
    if (this.lastConnectionAttempt && (now - this.lastConnectionAttempt) < this.connectionAttemptCooldown) {
      return this.isBackendAvailable;
    }
    
    this.lastConnectionAttempt = now;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.isBackendAvailable = response.ok;
      
      console.log(`📡 Backend connection status: ${this.isBackendAvailable ? 'Available ✓' : 'Unavailable ✗'} at ${new Date().toISOString()}`);
      return this.isBackendAvailable;
    } catch (error) {
      this.isBackendAvailable = false;
      console.error('📡 Backend connection failed:', error.message);
      return false;
    }
  }

  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.isBackendAvailable = true;
      return data;
    } catch (error) {
      this.isBackendAvailable = false;
      console.error('Health check error:', error);
      throw new Error('Unable to connect to the backend server. Please check your internet connection and try again.');
    }
  }

  // Authentication methods
  async login(credentials) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.authToken = data.token;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Backend is now available since login succeeded
        this.isBackendAvailable = true;
        
        console.log(`👤 User ${data.user.name || data.user.email} logged in at ${new Date().toISOString()}`);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    if (!this.authToken) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/auth/me`);
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to get user data');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      // If token is invalid, clear it
      if (error.message.includes('401') || error.message.includes('403')) {
        this.logout();
      }
      throw error;
    }
  }

  logout() {
    this.authToken = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log(`👋 User logged out at ${new Date().toISOString()}`);
  }

  isAuthenticated() {
    return !!this.authToken;
  }

  hasRole(role) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user && user.role === role;
    } catch (error) {
      return false;
    }
  }

  // Cars - Only real data from database
  async fetchAllCars(filters = {}) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    // Add pagination if not specified
    if (!queryParams.has('page')) {
      queryParams.append('page', '1');
    }
    if (!queryParams.has('limit')) {
      queryParams.append('limit', '12');
    }
    
    const url = `${this.API_URL}/cars?${queryParams.toString()}`;
    
    try {
      const response = await this._fetch(url);
      const data = await response.json();
      console.log(`✅ Fetched ${data.data?.length || 0} cars from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching cars from database:', error);
      throw new Error('Failed to load cars from database. Please try again later.');
    }
  }

  async fetchCarById(id) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._fetch(`${this.API_URL}/cars/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Car not found');
      }
    } catch (error) {
      console.error(`Error fetching car with ID ${id}:`, error);
      throw error;
    }
  }

  async createCar(carData) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to create cars');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/cars`, {
        method: 'POST',
        body: JSON.stringify(carData),
      });
      
      const data = await response.json();
      console.log(`✅ Car created in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  }

  async updateCar(id, carData) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to update cars');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(carData),
      });
      
      const data = await response.json();
      console.log(`✅ Car updated in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error updating car with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteCar(id) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to delete cars');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/cars/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      console.log(`✅ Car deleted from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error deleting car with ID ${id}:`, error);
      throw error;
    }
  }

  // Tours - Only real data from database
  async fetchAllTours(filters = {}) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    // Add pagination if not specified
    if (!queryParams.has('page')) {
      queryParams.append('page', '1');
    }
    if (!queryParams.has('limit')) {
      queryParams.append('limit', '12');
    }
    
    const url = `${this.API_URL}/tours?${queryParams.toString()}`;
    
    try {
      const response = await this._fetch(url);
      const data = await response.json();
      console.log(`✅ Fetched ${data.data?.length || 0} tours from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching tours from database:', error);
      throw new Error('Failed to load tours from database. Please try again later.');
    }
  }

  async fetchTourById(id) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._fetch(`${this.API_URL}/tours/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Tour not found');
      }
    } catch (error) {
      console.error(`Error fetching tour with ID ${id}:`, error);
      throw error;
    }
  }

  async createTour(tourData) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to create tours');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/tours`, {
        method: 'POST',
        body: JSON.stringify(tourData),
      });
      
      const data = await response.json();
      console.log(`✅ Tour created in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error creating tour:', error);
      throw error;
    }
  }

  async updateTour(id, tourData) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to update tours');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/tours/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tourData),
      });
      
      const data = await response.json();
      console.log(`✅ Tour updated in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error updating tour with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteTour(id) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to delete tours');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/tours/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      console.log(`✅ Tour deleted from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error deleting tour with ID ${id}:`, error);
      throw error;
    }
  }

  // Bookings - Only real data from database
  async fetchAllBookings(filters = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to access bookings');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const url = `${this.API_URL}/bookings?${queryParams.toString()}`;
    
    try {
      const response = await this._authenticatedFetch(url);
      const data = await response.json();
      console.log(`✅ Fetched ${data.data?.length || 0} bookings from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching bookings from database:', error);
      throw error;
    }
  }

  async createBooking(bookingData) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._fetch(`${this.API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      
      const data = await response.json();
      console.log(`✅ Booking created in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async updateBookingStatus(id, status) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to update booking status');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      console.log(`✅ Booking status updated in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error updating booking status for ID ${id}:`, error);
      throw error;
    }
  }

  // Analytics - Only real data from database
  async fetchDashboardAnalytics() {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to access analytics');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/analytics/dashboard`);
      const data = await response.json();
      console.log(`📊 Analytics data fetched from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard analytics from database:', error);
      throw error;
    }
  }

  // Messages - Only real data from database
  async fetchAllMessages(filters = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to access messages');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const url = `${this.API_URL}/messages?${queryParams.toString()}`;
    
    try {
      const response = await this._authenticatedFetch(url);
      const data = await response.json();
      console.log(`✅ Fetched ${data.data?.length || 0} messages from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching messages from database:', error);
      throw error;
    }
  }

  async createMessage(messageData) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._fetch(`${this.API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      
      const data = await response.json();
      console.log(`✅ Message created in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Employees - Only real data from database
  async fetchAllEmployees() {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('Admin authentication required to access employee data');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/users/employees`);
      const data = await response.json();
      console.log(`✅ Fetched ${data.data?.length || 0} employees from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error fetching employees from database:', error);
      throw error;
    }
  }

  async createEmployee(employeeData) {
    if (!this.isAuthenticated() || !this.hasRole('admin')) {
      throw new Error('Admin authentication required to create employees');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/users/employees`, {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
      
      const data = await response.json();
      console.log(`✅ Employee created in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }
  // Add these methods to your DataService class:

async updateEmployee(id, employeeData) {
  if (!this.isAuthenticated() || !this.hasRole('admin')) {
    throw new Error('Admin authentication required to update employees');
  }
  
  await this._checkConnection();
  
  if (!this.isBackendAvailable) {
    throw new Error('Backend server is currently unavailable. Please try again later.');
  }
  
  try {
    const response = await this._authenticatedFetch(`${this.API_URL}/users/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
    
    const data = await response.json();
    console.log(`✅ Employee updated in database at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`Error updating employee with ID ${id}:`, error);
    throw error;
  }
}

async deleteEmployee(id) {
  if (!this.isAuthenticated() || !this.hasRole('admin')) {
    throw new Error('Admin authentication required to delete employees');
  }
  
  await this._checkConnection();
  
  if (!this.isBackendAvailable) {
    throw new Error('Backend server is currently unavailable. Please try again later.');
  }
  
  try {
    const response = await this._authenticatedFetch(`${this.API_URL}/users/employees/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    console.log(`✅ Employee deleted from database at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`Error deleting employee with ID ${id}:`, error);
    throw error;
  }
}

async changeEmployeePassword(id, newPassword) {
  if (!this.isAuthenticated() || !this.hasRole('admin')) {
    throw new Error('Admin authentication required to change employee password');
  }
  
  await this._checkConnection();
  
  if (!this.isBackendAvailable) {
    throw new Error('Backend server is currently unavailable. Please try again later.');
  }
  
  try {
    const response = await this._authenticatedFetch(`${this.API_URL}/users/employees/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
    
    const data = await response.json();
    console.log(`✅ Employee password changed in database at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`Error changing password for employee with ID ${id}:`, error);
    throw error;
  }
}

// Also add missing message reply functionality:
async replyToMessage(messageId, replyContent) {
  if (!this.isAuthenticated()) {
    throw new Error('Authentication required to reply to messages');
  }
  
  await this._checkConnection();
  
  if (!this.isBackendAvailable) {
    throw new Error('Backend server is currently unavailable. Please try again later.');
  }
  
  try {
    const response = await this._authenticatedFetch(`${this.API_URL}/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ replyMessage: replyContent }),
    });
    
    const data = await response.json();
    console.log(`✅ Message reply sent and saved to database at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`Error replying to message with ID ${messageId}:`, error);
    throw error;
  }
}

async markMessageAsRead(messageId) {
  if (!this.isAuthenticated()) {
    throw new Error('Authentication required to mark messages as read');
  }
  
  await this._checkConnection();
  
  if (!this.isBackendAvailable) {
    throw new Error('Backend server is currently unavailable. Please try again later.');
  }
  
  try {
    const response = await this._authenticatedFetch(`${this.API_URL}/messages/${messageId}/read`, {
      method: 'PUT',
    });
    
    const data = await response.json();
    console.log(`✅ Message marked as read in database at ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`Error marking message as read with ID ${messageId}:`, error);
    throw error;
  }
}

  // Content - Only real data from database
  async fetchContent(type) {
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Content is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._fetch(`${this.API_URL}/content/${type}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Content not found');
      }
    } catch (error) {
      console.error(`Error fetching ${type} content from database:`, error);
      throw error;
    }
  }

  async updateContent(type, contentData) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to update content');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/content/${type}`, {
        method: 'PUT',
        body: JSON.stringify(contentData),
      });
      
      const data = await response.json();
      console.log(`✅ Content updated in database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error(`Error updating ${type} content:`, error);
      throw error;
    }
  }

  // Image upload
  async uploadImage(file, category = 'general') {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to upload images');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    
    try {
      const response = await fetch(`${this.API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Image uploaded to database at ${new Date().toISOString()}`);
        return data;
      } else {
        throw new Error(data.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required to delete images');
    }
    
    await this._checkConnection();
    
    if (!this.isBackendAvailable) {
      throw new Error('Backend server is currently unavailable. Please try again later.');
    }
    
    try {
      const response = await this._authenticatedFetch(`${this.API_URL}/upload/image/${imageId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      console.log(`✅ Image deleted from database at ${new Date().toISOString()}`);
      return data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Utility methods for fetching
  async _fetch(url, options = {}) {
    const defaultOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body) {
      defaultOptions.body = options.body;
    }

    return this._fetchWithRetry(url, defaultOptions);
  }

  async _authenticatedFetch(url, options = {}) {
    if (!this.authToken) {
      throw new Error('Authentication required');
    }

    const defaultOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers,
      },
    };

    if (options.body) {
      defaultOptions.body = options.body;
    }

    return this._fetchWithRetry(url, defaultOptions);
  }

  async _fetchWithRetry(url, options, attempt = 1) {
    console.log(`🔄 Fetching ${url} (attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS}) at ${new Date().toISOString()}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with ${response.status}: ${errorText}`;
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
          this.logout();
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Insufficient permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Resource not found.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS} failed:`, error.message);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection.');
      }
      
      if (attempt < this.MAX_RETRY_ATTEMPTS && !error.message.includes('401') && !error.message.includes('403')) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._fetchWithRetry(url, options, attempt + 1);
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        this.isBackendAvailable = false;
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }
}

// Create a singleton instance
const dataService = new DataService();
export default dataService;