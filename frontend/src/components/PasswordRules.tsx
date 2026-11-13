export default function PasswordRules({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
  ];

  return (
    <ul className="mb-4 -mt-2 space-y-1">
      {rules.map((r) => (
        <li key={r.label} className={`flex items-center text-xs ${r.ok ? 'text-success' : 'text-muted'}`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${r.ok ? 'bg-success' : 'bg-border'}`} />
          {r.label}
        </li>
      ))}
    </ul>
  );
}