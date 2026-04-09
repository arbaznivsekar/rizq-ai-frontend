import Link from 'next/link';

interface RizqLogoProps {
  /** Visual size preset */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Override the link destination (defaults to "/") */
  href?: string;
}

/**
 * Reusable RizqAI brand logo — black icon square + wordmark.
 * Matches the landing page Navbar design exactly.
 * Always navigates to the landing page on click.
 */
export function RizqLogo({ size = 'md', className = '', href = '/' }: RizqLogoProps) {
  const iconSize =
    size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const iconTextSize =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const wordmarkSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';
  const iconRadius =
    size === 'sm' ? 'rounded-md' : size === 'lg' ? 'rounded-xl' : 'rounded-lg';

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 ${className}`}
      aria-label="RizqAI Logo"
    >
      <div
        className={`${iconSize} ${iconRadius} bg-black flex items-center justify-center shrink-0`}
      >
        <span className={`text-white font-black ${iconTextSize} tracking-tight`}>
          R
        </span>
      </div>
      <span className={`text-black font-semibold ${wordmarkSize} tracking-tight`}>
        Rizq<span className="text-black/35">.AI</span>
      </span>
    </Link>
  );
}
