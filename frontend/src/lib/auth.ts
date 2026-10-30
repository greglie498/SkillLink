const TOKEN_KEY = 'skilllink_token';
const USER_KEY = 'skilllink_user';

export interface SessionUser {
    id: string;
    email: string;
    role: 'TALENT' | 'BUSINESS' | 'ADMIN';
}

export interface AuthResponse {
    user: SessionUser;
    token: string;
}

export function saveSession(token: string, user: SessionUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as SessionUser;
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function homePathFor(role: SessionUser['role']): string {
    switch (role) {
        case 'TALENT':
            return '/dashboard';
        case 'BUSINESS':
            return '/business';
        case 'ADMIN':
            return '/admin';
    }
}