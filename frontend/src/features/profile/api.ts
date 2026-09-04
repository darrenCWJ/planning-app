import { apiClient } from "../../lib/api-client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  current_password?: string;
  new_password?: string;
}

export async function fetchProfile(): Promise<UserProfile> {
  const resp = await apiClient.get("/api/users/me");
  return resp.data.data;
}

export async function updateProfile(data: UpdateProfileInput): Promise<UserProfile> {
  const resp = await apiClient.patch("/api/users/me", data);
  return resp.data.data;
}
