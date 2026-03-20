import { api } from "../api";

export interface LoginPayload {
  userId: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: unknown;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api
      .post<{ data: LoginResponse }>("/users/login", payload)
      .then((r) => r.data.data),
};
