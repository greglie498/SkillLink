import { useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { saveSession, type AuthResponse } from "../lib/auth";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import FormField from "../components/FormField";
import { validateEmail, validatePassword, validateRequired } from "../utils/validation";

type Role = 'talent' | 'business';

interface RegisterErrors {
    fullName: string | null;
    email: string | null;
    password: string | null;
}

export default function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState<Role>('talent');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Partial<RegisterErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        const newErrors: RegisterErrors = {
            fullName: validateRequired(fullName, 'Full name'),
            email: validateEmail(email),
            password: validatePassword(password),
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some((err) => err !== null)) return;

        setLoading(true);
        try{
            const data = await api<AuthResponse>('/auth/register', {
                method: 'POST',
                body: { role: role.toUpperCase(), name: fullName.trim(), email, password },
            });
            saveSession(data.token, data.user);
            navigate('/dashboard');
        } catch (err) {
            if (err instanceof ApiError && err.fieldErrors) {
                setErrors ({
                    fullName: err.fieldErrors.name ?? null,
                    email: err.fieldErrors.email ?? null,
                    password: err.fieldErrors.password ?? null,
                });
            } else if (err instanceof ApiError) {
                setFormError (err.message);
            } else {
                setFormError('Could not reach the server. Please try again.')
            }
        } finally {
            setLoading(false);
        }

    }

    return (
        <div className="min-h-screen bg-white">
            <TopNav />
            <div className="max-w-md mx-auto px-6 py-16">
                <h1 className="text-2xl font-bold text-ink mb-2">Create your account</h1>
                <p className="text-sm text-muted mb-6">Join SkillLink as talent or a Business.</p>
                
                {/* Role Selector */}
                <div className="flex gap-2 mb-6">
                    {(['talent', 'business'] as Role[]).map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors capitalize
                                ${role === r
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-ink border-border hover:border-primary/50'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                
                {formError && <p className="text-sm text-error mb-4">{formError}</p>}
                <form onSubmit={handleSubmit} noValidate>
                    <FormField
                        label={role === 'business' ? 'Business Name' : 'Full Name'}
                        value={fullName}
                        onChange={setFullName}
                        error={errors.fullName}
                        placeholder={role == 'business' ? 'e.g. Nairobi Crafts Co.' : 'e.g Jane Wanjiru'}
                    />
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
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p className="text-sm text-muted text-center mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium">Login</Link>
                </p>
            </div>
        </div>
    );
}