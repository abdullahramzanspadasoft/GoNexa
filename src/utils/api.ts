const API_BASE_URL = "/api";

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string | null;
  createdAt?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// API helper function
const apiCall = async <T>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  signup: async (userData: SignupData): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/signup", {
      method: "POST",
      body: userData,
    });
  },

  signin: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return apiCall<AuthResponse>("/auth/signin", {
      method: "POST",
      body: { email, password },
    });
  },

  getCurrentUser: async (token: string): Promise<ApiResponse<User>> => {
    return apiCall<User>("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Save token to localStorage
export const saveToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem("authToken");
};

export type { User };
