import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../utils/validation";
import TopNav from "../components/TopNav";
import FormField from "../components/FormField";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
    
        const newErrors = {
            email: validateEmail(email),
            password: validatePassword(password),
        };
        setErrors(newErrors);
    
        const hasErrors = Object.values(newErrors).some((err) => err !== null);
        if (hasErrors) return;
    
        // Pending Backend
        console.log('Logging in:', { email });
        navigate('/dashboard');
    }
    
    return (
        <div className="min-h-screen bg-white">
            <TopNav />
            <div className="max-w-md mx-auto px-6 py-16">
                <h1 className="text-2xl font-bold text-link mb-2">Welcome back</h1>
                <p className="text-sm text-muted mb-6"> Login to your SkillLink account.</p>

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
                        className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors mt-2"
                    >
                        Login
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