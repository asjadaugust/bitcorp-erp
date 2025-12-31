export interface User {
  id: string | number;
  username: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
