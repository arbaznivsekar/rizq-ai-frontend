"use client";

import React from "react";

interface CompanyLogoProps {
  name?: string;
  domain?: string;
  logoUrl?: string;
  size?: number; // px
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
  const sources = ['naukri.com','linkedin.com','indeed.com','glassdoor.com','monsterindia.com','timesjobs.com'];
  return sources.some(s => d === s || d.endsWith(`.${s}`));
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ name = "", domain, logoUrl, size = 40, className = "" }) => {
  const [sourceIndex, setSourceIndex] = React.useState(0);

  const initials = React.useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const letters = (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
    return letters || name[0]?.toUpperCase() || "?";
  }, [name]);

  const normalizedDomainRaw = extractDomain(domain);
  const normalizedDomain = isSourceDomain(normalizedDomainRaw) ? undefined : normalizedDomainRaw;
  const sources: (string | undefined)[] = [
    logoUrl,
    normalizedDomain ? `https://logo.clearbit.com/${normalizedDomain}` : undefined,
    normalizedDomain ? `https://icons.duckduckgo.com/ip3/${normalizedDomain}.ico` : undefined,
  ];
  const currentSrc = sources[sourceIndex];

  const commonStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  if (!currentSrc) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-slate-100 text-slate-700 font-semibold ${className}`}
        style={commonStyle}
        aria-label={name}
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
      onError={() => setSourceIndex((idx) => idx + 1)}
      className={`rounded-md object-contain bg-white ${className}`}
      style={commonStyle}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

export default CompanyLogo;


