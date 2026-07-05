'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function WritePage() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Auto-focus on mount — zero-click start
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Update char count
  useEffect(() => {
    setCharCount(text.length);
  }, [text]);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, exiting: false });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, exiting: true } : null));
      setTimeout(() => setToast(null), 300);
    }, 2500);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Get local date in YYYY-MM-DD format
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), date: localDate }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      const data = await res.json();

      if (data.appended) {
        showToast('Appended to today\'s entry ✦');
      } else {
        showToast('New entry saved ✦');
      }

      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, isSubmitting, showToast]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 fade-in">
        <div>
          <p className="text-muted text-sm tracking-wide">{dateStr}</p>
        </div>
        <Link
          href="/read"
          className="text-muted hover:text-amber-glow transition-colors duration-300 text-sm flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Read journal
        </Link>
      </header>

      {/* Editor */}
      <div className="flex-1 flex flex-col px-6 pb-6 fade-in" style={{ animationDelay: '0.1s' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start writing..."
          className="flex-1 w-full bg-transparent text-foreground text-lg leading-relaxed resize-none py-4 placeholder:text-zinc-700 focus:outline-none font-sans"
          spellCheck="true"
          autoComplete="off"
          aria-label="Journal entry"
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-4">
            {charCount > 0 && (
              <span className="text-xs text-muted tabular-nums transition-opacity duration-300">
                {charCount} {charCount === 1 ? 'character' : 'characters'}
              </span>
            )}
            <span className="text-xs text-zinc-700">
              Ctrl+Enter to save
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
              ${
                text.trim()
                  ? 'bg-amber-glow hover:bg-amber-600 text-white cursor-pointer btn-glow shadow-lg shadow-amber-900/20'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner" />
                Saving...
              </span>
            ) : (
              'Save entry'
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`
            fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            px-5 py-3 rounded-xl text-sm font-medium
            backdrop-blur-xl border shadow-2xl
            ${
              toast.type === 'error'
                ? 'bg-red-950/80 border-red-800/50 text-red-200'
                : 'bg-zinc-900/80 border-zinc-700/50 text-zinc-100'
            }
            ${toast.exiting ? 'toast-exit' : 'toast-enter'}
          `}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
