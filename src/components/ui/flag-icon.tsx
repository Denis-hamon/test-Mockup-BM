import { cn } from "@/lib/utils";

interface FlagIconProps {
  code: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-3",
  md: "w-5 h-4",
  lg: "w-6 h-4",
};

// SVG flag components for supported languages
const flags: Record<string, React.ReactNode> = {
  fr: (
    // France
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#002654" d="M0 0h213.3v480H0z"/>
      <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
      <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
    </svg>
  ),
  en: (
    // United Kingdom
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#012169" d="M0 0h640v480H0z"/>
      <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
      <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z"/>
      <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
      <path fill="#C8102E" d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z"/>
    </svg>
  ),
  es: (
    // Spain
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#c60b1e" d="M0 0h640v480H0z"/>
      <path fill="#ffc400" d="M0 120h640v240H0z"/>
    </svg>
  ),
  de: (
    // Germany
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#000" d="M0 0h640v160H0z"/>
      <path fill="#D00" d="M0 160h640v160H0z"/>
      <path fill="#FFCE00" d="M0 320h640v160H0z"/>
    </svg>
  ),
  it: (
    // Italy
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#009246" d="M0 0h213.3v480H0z"/>
      <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
      <path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/>
    </svg>
  ),
  pt: (
    // Portugal
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#006600" d="M0 0h232v480H0z"/>
      <path fill="#FF0000" d="M232 0h408v480H232z"/>
      <circle cx="232" cy="240" r="80" fill="#FFCC00"/>
      <circle cx="232" cy="240" r="60" fill="#FF0000"/>
      <path fill="#fff" d="M200 200h64v80h-64z"/>
    </svg>
  ),
  nl: (
    // Netherlands
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#21468B" d="M0 0h640v480H0z"/>
      <path fill="#FFF" d="M0 0h640v320H0z"/>
      <path fill="#AE1C28" d="M0 0h640v160H0z"/>
    </svg>
  ),
  pl: (
    // Poland
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#fff" d="M0 0h640v240H0z"/>
      <path fill="#dc143c" d="M0 240h640v240H0z"/>
    </svg>
  ),
};

// Default flag for unknown codes
const defaultFlag = (
  <svg viewBox="0 0 640 480" className="w-full h-full">
    <rect fill="#e5e7eb" width="640" height="480"/>
    <text x="320" y="260" textAnchor="middle" fill="#6b7280" fontSize="120" fontFamily="system-ui">?</text>
  </svg>
);

export function FlagIcon({ code, className, size = "md" }: FlagIconProps) {
  const flag = flags[code.toLowerCase()] || defaultFlag;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-sm border border-border/50 shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      {flag}
    </span>
  );
}

export default FlagIcon;
