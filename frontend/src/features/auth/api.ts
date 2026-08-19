import { apiClient } from "../../lib/api-client";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
  };
}

export interface AuthData {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string
): Promise<AuthData> {
  const resp = await apiClient.post<AuthResponse>("/api/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  return resp.data.data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthData> {
  const resp = await apiClient.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return resp.data.data;
}
