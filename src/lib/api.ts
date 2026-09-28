const BASE_URL = "https://findcollab.com/api";

const SECRET_KEYS = new Set(["password", "password_reset_token", "mailverificationcode", "passwordflag", "fbid", "partnerid"]);

/** Deep-remove secret fields from any API payload before it reaches the app or storage. */
export const sanitize = <T = any>(value: T): T => {
  if (Array.isArray(value)) return value.map(sanitize) as any;
  if (value && typeof value === "object" && !(value instanceof File) && !(value instanceof Blob)) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (!SECRET_KEYS.has(k.toLowerCase())) out[k] = sanitize(v);
    }
    return out as T;
  }
  return value;
};

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
    isFormData = false,
  ): Promise<T> {
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = { method, headers };

    // Append token to URL so LiteSpeed server can read it
    const urlWithToken = this.token
      ? `${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${this.token}`
      : `${BASE_URL}${endpoint}`;

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

    const res = await fetch(urlWithToken, config);
    const text = await res.text();

    const jsonStart = text.indexOf("{");
    if (jsonStart === -1) {
      throw new Error(`Request failed (${res.status})`);
    }

    const json = sanitize(JSON.parse(text.slice(jsonStart)));

    if (!res.ok || json?.data?.status === false) {
      const msg = json?.data?.message || `Request failed (${res.status})`;

      // Auto-logout on expired/invalid token
      if (msg.toLowerCase().includes("invalid or expired token")) {
        this.setToken(null);
        localStorage.removeItem("fc_user");
        localStorage.removeItem("fc_user_detail");
        window.location.reload();
      }

      const err: any = new Error(msg);
      err.data = json?.data;
      err.status = res.status;
      throw err;
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
