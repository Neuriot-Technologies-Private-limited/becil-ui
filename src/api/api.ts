import axios, { type AxiosInstance } from "axios";
import { getApiUrl } from "@/env";

const baseURL = getApiUrl();

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail ?? error.message ?? "Request failed";
    console.error("[API]", message);
    return Promise.reject(error);
  }
);

export function getBaseUrl(): string {
  return baseURL;
}
