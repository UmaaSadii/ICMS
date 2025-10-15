import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: string;
  name?: string;
  contact?: string;
  cnic?: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  user: any;
  access_token: string;
  refresh_token: string;
  message?: string;
}

interface BackendResponse {
  message: string;
  user: any;
  access_token: string;
  refresh_token: string;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    console.log('Sending registration data:', data);
    const response = await apiClient.post<BackendResponse>('register/registration/', data);
    
    console.log('Raw registration response:', response);
    
    // Check if we have the expected response structure
    if (response.data && response.data.access_token && response.data.user) {
      // Set token for future requests
      apiClient.defaults.headers.common['Authorization'] = `Token ${response.data.access_token}`;
      
      // Return in the format expected by AuthContext
      return {
        user: response.data.user,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      };
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response structure from server');
    }
  } catch (error) {
    console.error('Registration error details:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Registration failed');
  }
};

const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('Sending login data:', data);
    const response = await apiClient.post<BackendResponse>('register/login/', data);
    
    console.log('Raw login response:', response);
    
    if (response.data && response.data.access_token && response.data.user) {
      // Set token for future requests
      apiClient.defaults.headers.common['Authorization'] = `Token ${response.data.access_token}`;
      
      // Return in the format expected by AuthContext
      return {
        user: response.data.user,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
      };
    } else {
      console.error('Unexpected login response structure:', response.data);
      throw new Error('Invalid response structure from server');
    }
  } catch (error) {
    console.error('Login error details:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Login failed');
  }
};

const logout = (): void => {
  localStorage.removeItem('auth');
  // Remove auth header
  delete apiClient.defaults.headers.common['Authorization'];
};

const getCurrentUser = (): AuthResponse | null => {
  const authStr = localStorage.getItem('auth');
  if (authStr) {
    return JSON.parse(authStr);
  }
  return null;
};

const getProfile = async (): Promise<any> => {
  const currentUser = getCurrentUser();
  
  if (!currentUser || !currentUser.access_token) {
    throw new Error('User not authenticated');
  }
  
  try {
    // No need to set headers manually as they're set globally after login
    const response = await apiClient.get('profile/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw new Error('Failed to fetch profile');
  }
};

// Setup axios interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const currentUser = getCurrentUser();
        
        if (currentUser && currentUser.refresh_token) {
          // Try to refresh the token
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: currentUser.refresh_token
          });
          
          const { access } = response.data;
          
          // Update stored auth with new access token
          currentUser.access_token = access;
          localStorage.setItem('auth', JSON.stringify(currentUser));
          
          // Update header and retry original request
          apiClient.defaults.headers.common['Authorization'] = `Token ${access}`;
          originalRequest.headers['Authorization'] = `Token ${access}`;
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Set auth header for all requests if user is logged in
const setupAxiosInterceptors = (): void => {
  const currentUser = getCurrentUser();
  
  if (currentUser && currentUser.access_token) {
    apiClient.defaults.headers.common['Authorization'] = `Token ${currentUser.access_token}`;
  }
};

// Call this when app initializes
setupAxiosInterceptors();

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  getProfile,
};

export default authService;
