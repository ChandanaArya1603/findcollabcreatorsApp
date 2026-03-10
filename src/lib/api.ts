const BASE_URL = "https://findcollab.com/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("fc_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("fc_token", token);
    } else {
      localStorage.removeItem("fc_token");
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T = any>(
    method: string,
    endpoint: string,
    body?: Record<string, any>,
    isFormData = false
  ): Promise<T> {
    const headers: Record<string, string> = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = { method, headers };

    if (body) {
      if (isFormData) {
        const fd = new FormData();
        Object.entries(body).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => fd.append(`${key}[]`, String(v)));
          } else if (value instanceof File) {
            fd.append(key, value);
          } else {
            fd.append(key, String(value));
          }
        });
        config.body = fd;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const json = await res.json();

    if (!res.ok || json?.data?.status === false) {
      throw new Error(json?.data?.message || `Request failed (${res.status})`);
    }

    return json.data;
  }

  get<T = any>(endpoint: string) {
    return this.request<T>("GET", endpoint);
  }

  post<T = any>(endpoint: string, body?: Record<string, any>) {
    return this.request<T>("POST", endpoint, body);
  }

  postForm<T = any>(endpoint: string, body: Record<string, any>) {
    return this.request<T>("POST", endpoint, body, true);
  }
}

export const api = new ApiClient();
