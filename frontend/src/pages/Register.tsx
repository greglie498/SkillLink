import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import FormField from '../components/FormField';
import PasswordRules from '../components/PasswordRules';
import Icon, { type IconName } from '../components/Icon';
import { api, ApiError } from '../lib/api';
import { saveSession, homePathFor, type AuthResponse } from '../lib/auth';
import { validateEmail, validatePassword, validateRequired } from '../utils/validation';

type Role = 'talent' | 'business';

interface RegisterErrors {
  fullName: string | null;
  email: string | null;
  password: string | null;
  confirm: string | null;
}

const roles: { key: Role; title: string; desc: string; icon: IconName }[] = [
  { key: 'talent', title: 'Talent', desc: 'Students, graduates and early-career professionals', icon: 'user' },
  { key: 'business', title: 'Business', desc: 'SMEs looking to hire skilled talent for projects', icon: 'briefcase' },
];

export default function Register() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [role, setRole] = useState<Role>(params.get('role') === 'business' ? 'business' : 'talent');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Partial<RegisterErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        const newErrors: RegisterErrors = {
        fullName: validateRequired(fullName, role === 'business' ? 'Business name' : 'Full name'),
        email: validateEmail(email),
        password: validatePassword(password),
        confirm: confirm ? (confirm === password ? null : 'Passwords do not match.') : 'Confirm your password.',
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((err) => err !== null)) return;

        setLoading(true);
        try {
        const data = await api<AuthResponse>('/auth/register', {
            method: 'POST',
            body: { role: role.toUpperCase(), name: fullName.trim(), email, password },
        });
        saveSession(data.token, data.user);
        navigate(homePathFor(data.user.role));
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors({
            fullName: err.fieldErrors.name ?? null,
            email: err.fieldErrors.email ?? null,
            password: err.fieldErrors.password ?? null,
            });
        } else if (err instanceof ApiError) {
            setFormError(err.message);
        } else {
            setFormError('Could not reach the server. Please try again.');
        }
        } finally {
        setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-surface">
            <TopNav />
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
                <div className="bg-white border border-border rounded-2xl shadow-[0_20px_60px_rgba(30,33,48,.08)] w-full max-w-lg p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-deep">Create your account</h1>
                        <p className="text-sm text-muted mt-1">Choose the account type that fits you</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {roles.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRole(r.key)}
                            className={`text-left rounded-xl border-2 p-4 transition-colors ${
                            role === r.key ? 'border-primary bg-primary-tint' : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-lg bg-white text-primary flex items-center justify-center mb-3 shadow-sm">
                            <Icon name={r.icon} className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-ink">{r.title}</p>
                            <p className="text-xs text-muted mt-1">{r.desc}</p>
                        </button>
                        ))}
                    </div>

                    {role === 'business' && (
                        <p className="text-xs text-[#A66E12] bg-[#FFF6E5] border border-[#F5DFB4] rounded-lg px-3 py-2 mb-4">
                        Business accounts are verified by an administrator before they can publish opportunities.
                        </p>
                    )}

                    <form onSubmit={handleSubmit} noValidate className={role === 'business' ? '' : 'mt-4'}>
                        {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                        <FormField
                        label={role === 'business' ? 'Business name' : 'Full name'}
                        value={fullName}
                        onChange={setFullName}
                        error={errors.fullName}
                        placeholder={role === 'business' ? 'e.g. Nairobi Crafts Co.' : 'e.g. Jane Wanjiru'}
                        />
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
                        placeholder="At least 8 characters"
                        />
                        <PasswordRules password={password} />
                        <FormField
                        label="Confirm password"
                        type="password"
                        value={confirm}
                        onChange={setConfirm}
                        error={errors.confirm}
                        placeholder="Repeat your password"
                        />

                        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
                        {loading ? 'Creating account...' : role === 'talent' ? 'Create talent account' : 'Create business account'}
                        </button>
                    </form>

                    <p className="text-sm text-muted text-center mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-dark font-semibold">
                        Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}