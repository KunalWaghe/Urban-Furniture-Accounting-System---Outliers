export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse extends AuthUser {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
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
