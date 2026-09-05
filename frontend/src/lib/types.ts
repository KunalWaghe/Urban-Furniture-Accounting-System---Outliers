export interface AuthUser {
  id: number;
  login_id?: string | null;
  email: string;
  name: string;
  role: string;
  contact_id?: number | null;
}

export interface AuthResponse extends AuthUser {
  token: string;
}

export interface AdminCreateUserRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  contact_id?: number | null;
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface RegisterRequest {
  login_id: string;
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    request_id?: string;
  };
}
