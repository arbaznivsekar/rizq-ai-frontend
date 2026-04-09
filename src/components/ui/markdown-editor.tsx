'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  maxLength?: number;
  placeholder?: string;
  className?: string;
};

/** Parse stored "- line\n- line" (or "* line", "• line") → clean string array */
function parseToLines(raw: string): string[] {
  if (!raw?.trim()) return [''];
  const lines = raw
    .split('\n')
    .map(line => line.replace(/^[\s]*[-*•]\s*/, '').trim())
    .filter((line, i, arr) => line.length > 0 || i === arr.length - 1);
  return lines.length > 0 ? lines : [''];
}

/** Serialize string array → "- line\n- line" */
function serializeLines(lines: string[]): string {
  return lines
    .filter(l => l.trim().length > 0)
    .map(l => `- ${l.trim()}`)
    .join('\n');
}

export function MarkdownEditor({
  value = '',
  onChange,
  label,
  maxLength,
  placeholder,
  className,
}: MarkdownEditorProps) {
  const [lines, setLines] = React.useState<string[]>(() => parseToLines(value));
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const lastEmitted = React.useRef(value);

  // Sync from external value only when it differs from what we last emitted
  React.useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setLines(parseToLines(value));
    }
  }, [value]);

  const emit = (newLines: string[]) => {
    const serialized = serializeLines(newLines);
    lastEmitted.current = serialized;
    onChange(serialized);
  };

  const updateLine = (index: number, text: string) => {
    const next = [...lines];
    next[index] = text;
    setLines(next);
    emit(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = [...lines];
      next.splice(index + 1, 0, '');
      setLines(next);
      emit(next);
      requestAnimationFrame(() => inputRefs.current[index + 1]?.focus());

    } else if (e.key === 'Backspace' && lines[index] === '' && lines.length > 1) {
      e.preventDefault();
      const next = lines.filter((_, i) => i !== index);
      setLines(next);
      emit(next);
      requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus());

    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();

    } else if (e.key === 'ArrowDown' && index < lines.length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) { updateLine(0, ''); return; }
    const next = lines.filter((_, i) => i !== index);
    setLines(next);
    emit(next);
    requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus());
  };

  const addBullet = () => {
    const next = [...lines, ''];
    setLines(next);
    emit(next);
    requestAnimationFrame(() => inputRefs.current[next.length - 1]?.focus());
  };

  const totalChars = serializeLines(lines).length;
  const atLimit = maxLength ? totalChars >= maxLength : false;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">{label}</span>
          {typeof maxLength === 'number' && (
            <span className={cn('text-xs', atLimit ? 'text-red-500' : 'text-muted-foreground')}>
              {totalChars}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Bullet Points
          </span>
          <span className="ml-auto text-[11px] text-slate-400">
            ↵ new bullet &nbsp;·&nbsp; ⌫ remove empty
          </span>
        </div>

        {/* Bullet rows */}
        <div className="px-3 pt-3 pb-1 space-y-1.5 min-h-[80px]">
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2 group">
              {/* Bullet dot */}
              <span className="shrink-0 w-4 flex justify-center">
                <span className="w-[5px] h-[5px] rounded-full bg-slate-300 group-focus-within:bg-blue-400 transition-colors mt-[2px]" />
              </span>

              {/* Text input */}
              <input
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                value={line}
                onChange={e => {
                  // Guard max length
                  const candidate = [...lines.slice(0, index), e.target.value, ...lines.slice(index + 1)];
                  if (maxLength && serializeLines(candidate).length > maxLength) return;
                  updateLine(index, e.target.value);
                }}
                onKeyDown={e => handleKeyDown(e, index)}
                placeholder={
                  index === 0
                    ? (placeholder ?? 'Describe a responsibility or achievement…')
                    : 'Add another point…'
                }
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 py-0.5 leading-relaxed"
              />

              {/* Remove button — visible on row hover */}
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  tabIndex={-1}
                  className="opacity-0 group-hover:opacity-100 shrink-0 w-4 h-4 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add bullet CTA */}
        <div className="px-3 pb-3 pt-1">
          <button
            type="button"
            onClick={addBullet}
            disabled={atLimit}
            className="flex items-center gap-1 text-[12px] font-medium text-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add bullet
          </button>
        </div>
      </div>
    </div>
  );
}
