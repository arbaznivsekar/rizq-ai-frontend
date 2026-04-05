"use client";

import React from "react";

interface CompanyLogoProps {
  name?: string;
  domain?: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

function extractDomain(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    const url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function isSourceDomain(domain?: string): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase();
  const sources = [
    'naukri.com', 'linkedin.com', 'indeed.com',
    'glassdoor.com', 'monsterindia.com', 'timesjobs.com',
    'shine.com', 'foundit.in', 'apna.co',
  ];
  return sources.some(s => d === s || d.endsWith(`.${s}`));
}

// Generate a consistent color from company name
function getAvatarColor(name: string): string {
  const colors = [
    ['#E0F2FE', '#0369A1'], // blue
    ['#F0FDF4', '#15803D'], // green
    ['#FEF9C3', '#A16207'], // yellow
    ['#FDF2F8', '#9D174D'], // pink
    ['#EDE9FE', '#6D28D9'], // purple
    ['#FFF7ED', '#C2410C'], // orange
    ['#F0FDFA', '#0F766E'], // teal
    ['#FEF2F2', '#B91C1C'], // red
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index][0] + '|' + colors[index][1];
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name = "",
  domain,
  logoUrl,
  size = 40,
  className = "",
}) => {
  const [sourceIndex, setSourceIndex] = React.useState(0);
  const [allFailed, setAllFailed] = React.useState(false);

  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const letters =
      (parts[0]?.[0] || "").toUpperCase() +
      (parts[1]?.[0] || "").toUpperCase();
    return letters || name[0]?.toUpperCase() || "?";
  }, [name]);

  const colorPair = React.useMemo(() => getAvatarColor(name), [name]);
  const [bgColor, textColor] = colorPair.split('|');

  const normalizedDomainRaw = extractDomain(domain);
  const normalizedDomain = isSourceDomain(normalizedDomainRaw)
    ? undefined
    : normalizedDomainRaw;

  const sources: (string | undefined)[] = React.useMemo(() => [
    logoUrl || undefined,
    normalizedDomain
      ? `https://logo.clearbit.com/${normalizedDomain}`
      : undefined,
    normalizedDomain
      ? `https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=128`
      : undefined,
    normalizedDomain
      ? `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico`
      : undefined,
  ].filter(Boolean), [logoUrl, normalizedDomain]);

  const currentSrc = sources[sourceIndex];

  const commonStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((idx) => idx + 1);
    } else {
      setAllFailed(true);
    }
  };

  // Fallback — colored initials avatar
  if (!currentSrc || allFailed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg font-bold select-none ${className}`}
        style={{
          ...commonStyle,
          backgroundColor: bgColor,
          color: textColor,
          fontSize: size * 0.35,
          letterSpacing: '-0.02em',
        }}
        aria-label={name}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={`${name} logo`}
      onError={handleError}
      className={`rounded-lg object-contain bg-white ${className}`}
      style={{
        ...commonStyle,
        imageRendering: 'auto',
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

export default CompanyLogo;