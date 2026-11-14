interface LogoProps {
  className?: string;
  size?: number;
}

export function SkillLinkLogo({ className = "w-8 h-8", size }: LogoProps) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        fill="none"
        >
        {/* Outer Connection Network Lines */}
        <path
            d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z"
            stroke="#FF6B00"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        
        {/* Central Node Connection */}
        <path d="M50 15 L50 50 M80 35 L50 50 M20 35 L50 50 M80 65 L50 50 M20 65 L50 50" stroke="#FF6B00" strokeWidth="4" opacity="0.6" />

        {/* Core Node Circles */}
        <circle cx="50" cy="15" r="8" fill="#FF6B00" />
        <circle cx="80" cy="35" r="8" fill="#FF6B00" />
        <circle cx="80" cy="65" r="8" fill="#FF6B00" />
        <circle cx="50" cy="85" r="8" fill="#FF6B00" />
        <circle cx="20" cy="65" r="8" fill="#FF6B00" />
        <circle cx="20" cy="35" r="8" fill="#FF6B00" />
        
        {/* Central Hub with Check / Lion Motif */}
        <circle cx="50" cy="50" r="14" fill="#1A2E3B" />
        <path
            d="M42 50 L47 55 L58 42"
            stroke="#22C55E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        </svg>
    );
}