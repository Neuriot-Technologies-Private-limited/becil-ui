import { api } from "../api";

export interface HealthResponse {
  ok: boolean;
  database: { ok: boolean };
  s3: { ok: boolean; configured?: boolean; detail?: string };
  uploads_ready: boolean;
}

export const healthService = {
  check: () => api.get<HealthResponse>("/health").then((r) => r.data),
};
