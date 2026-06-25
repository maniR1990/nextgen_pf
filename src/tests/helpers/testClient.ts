const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

interface TestResponse {
  status: number;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

class TestClient {
  private token?: string;

  auth(token: string) {
    this.token = token;
    return this;
  }

  async get(path: string): Promise<TestResponse> {
    return this.request('GET', path);
  }

  async post(path: string) {
    return { send: (body: unknown) => this.request('POST', path, body) };
  }

  private async request(method: string, path: string, body?: unknown): Promise<TestResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });

    return { status: res.status, body: parsed, headers: resHeaders };
  }
}

export function createTestClient() {
  return new TestClient();
}
