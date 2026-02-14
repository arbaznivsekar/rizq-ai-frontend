'use client';

import * as React from 'react';
import { Textarea } from './textarea';
import { Button } from './button';
import { cn } from '@/lib/utils';

type MarkdownEditorProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value'
> & {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  maxLength?: number;
};

export function MarkdownEditor({
  value,
  onChange,
  label,
  maxLength,
  className,
  placeholder,
  ...textareaProps
}: MarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const applyFormatter = (formatter: (text: string, selectionStart: number, selectionEnd: number) => string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const newValue = formatter(value, start, end);
    onChange(newValue);

    // Restore focus for smoother UX
    requestAnimationFrame(() => {
      el.focus();
    });
  };

  const toggleBulletList = () => {
    applyFormatter((text, start, end) => {
      const before = text.slice(0, start);
      const selection = text.slice(start, end);
      const after = text.slice(end);

      const lines = (selection || '').split('\n');
      const formatted = lines
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return '- ';
          if (/^[-*]\s+/.test(trimmed)) return trimmed;
          return `- ${trimmed}`;
        })
        .join('\n');

      return `${before}${formatted}${after}`;
    });
  };

  const toggleNumberedList = () => {
    applyFormatter((text, start, end) => {
      const before = text.slice(0, start);
      const selection = text.slice(start, end);
      const after = text.slice(end);

      const lines = (selection || '').split('\n');
      const formatted = lines
        .map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return `${index + 1}. `;
          if (/^\d+\.\s+/.test(trimmed)) return trimmed;
          return `${index + 1}. ${trimmed}`;
        })
        .join('\n');

      return `${before}${formatted}${after}`;
    });
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    if (maxLength && next.length > maxLength) {
      onChange(next.slice(0, maxLength));
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">{label}</span>
          {typeof maxLength === 'number' && (
            <span className="text-xs text-muted-foreground">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="rounded-md border bg-slate-50">
        <div className="flex items-center gap-1 border-b bg-slate-50 px-2 py-1.5">
          <span className="text-xs font-medium text-slate-500 mr-2">Formatting</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleBulletList}
          >
            • Bullets
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleNumberedList}
          >
            1. 2. 3.
          </Button>
          <span className="ml-auto text-[11px] text-slate-400">
            Use markdown: start lines with <code>-</code> or <code>*</code>
          </span>
        </div>

        <div className="p-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            className={cn('min-h-[96px] resize-y bg-white', className)}
            placeholder={placeholder ?? 'Use markdown bullets to describe your impact...'}
            {...textareaProps}
          />
        </div>
      </div>
    </div>
  );
}

