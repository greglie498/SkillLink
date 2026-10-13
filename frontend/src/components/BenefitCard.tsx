interface BenefitCardProps {
    title: string;
    description: string;
}

export default function Banefitcard ({ title, description }: BenefitCardProps) {
    return (
        <div className="bg-white border border-border rounded-card p-6 shadow-sm">
            <h3 className="text-based font-semiibold text-ink mb-2">{title}</h3>
            <p className="text-sm text-muted">{description}</p>
        </div>
    );
}