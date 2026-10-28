export const  JWT_SECRET = process.env.JWT_SECRET ?? '';

if (!JWT_SECRET) {
    throw new Error ('JWT_SECRET is not set in env')
}
if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
}

export const  JWT_EXPIRES_IN = '1h';
export const BCRYPT_ROUNDS = 12;