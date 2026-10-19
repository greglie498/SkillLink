import { getToken, clearSession } from "./auth";

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
    status: number;
    fieldErrors?: Record<string, string>;

    constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
        super(message);
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

interface Options {
    method?: string;
    body?: unknown;
    auth?: boolean;
}

export async function api<T>(path: string, { method = 'GET', body, auth = false }: Options = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 && auth) clearSession();
        throw new ApiError(data.message ?? `Request failed (${res.status}).`, res.status, data.errors);
    }
    return data as T;
}