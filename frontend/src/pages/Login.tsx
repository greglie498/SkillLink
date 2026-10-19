import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { saveSession, type AuthResponse } from "../lib/auth";
import { validateEmail, validateRequired } from "../utils/validation";
import TopNav from "../components/TopNav";
import FormField from "../components/FormField";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
    
        const newErrors = {
            email: validateEmail(email),
            password: validateRequired(password, 'Password'),
        };
        setErrors(newErrors);
    
       if (Object.values(newErrors).some((err) => err !== null)) return;

        setLoading(true);
        try{
            const data = await api<AuthResponse>('/auth/login', {
                method: 'POST',
                body: { email, password },
            });
            saveSession(data.token, data.user);
            navigate('/dashboard');
        } catch (err) {
            setFormError(
                err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.'
            );
        } finally {
            setLoading(false);
        }

    }
    
    return (
        <div className="min-h-screen bg-white">
            <TopNav />
            <div className="max-w-md mx-auto px-6 py-16">
                <h1 className="text-2xl font-bold text-link mb-2">Welcome back</h1>
                <p className="text-sm text-muted mb-6"> Login to your SkillLink account.</p>

                {formError && <p className="text-sm text-error mb-4">{formError}</p>}
                <form onSubmit={handleSubmit} noValidate>
                    <FormField
                        label="Email"
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
                        placeholder="At least 8 characters"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-md transition-colo9rs mt-2"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-sm text-muted text-center mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary font-medium">Register</Link>
                </p>
            </div>
        </div>
    );

}