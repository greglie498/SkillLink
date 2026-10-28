export function validateEmail(email: string): string | null {
    if (!email.trim()) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Enter a valid email address.';
    return null;
}

export function validatePassword(password: string): string | null {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password.length > 72) return 'Passworde must be at most 72 characters.';
    if (!/[A_Z]/.test(password)) return 'Password must include at least one uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must include at least one number';
    return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
    if (!value.trim()) return `${fieldName} is required.`;
    return null;
}

export function validateLength(value: string, fieldName: string, min: number, max: number): string | null {
    if (value.length < min) return `${fieldName} must be at least ${min} charcaters.`;
    if (value.length > max) return `${fieldName} must be no more than ${max} characters.`;
    return null;
}

export function validateMaxLength(value: string, fieldName: string, max: number): string | null {
    if (value.length > max) return `${fieldName} must be no more than ${max} characters.`;
    return null;
}