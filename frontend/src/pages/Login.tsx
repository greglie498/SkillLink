import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import FormField from '../components/FormField';
import { api, ApiError } from '../lib/api';
import { saveSession, homePathFor, type AuthResponse } from '../lib/auth';
import { validateEmail, validateRequired } from '../utils/validation';

interface LoginErrors {
  email: string | null;
  password: string | null;
}

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Partial<LoginErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        const newErrors: LoginErrors = {
        email: validateEmail(email),
        password: validateRequired(password, 'Password'),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((err) => err !== null)) return;

        setLoading(true);
        try {
        const data = await api<AuthResponse>('/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        saveSession(data.token, data.user);
        navigate(homePathFor(data.user.role));
        } catch (err) {
        setFormError(err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.');
        } finally {
        setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface">
            <TopNav />
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
                <div className="bg-white border border-border rounded-2xl shadow-[0_20px_60px_rgba(30,33,48,.08)] w-full max-w-md p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-deep">Welcome back</h1>
                        <p className="text-sm text-muted mt-1">Log in to your SkillLink account</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                        <FormField
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        error={errors.email}
                        placeholder="you@example.com"
                        />
                        <FormField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        error={errors.password}
                        placeholder="Your password"
                        />

                        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
                        {loading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    <p className="text-sm text-muted text-center mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-dark font-semibold">
                        Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}