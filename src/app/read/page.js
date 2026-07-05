'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

export default function ReadPage() {
  const [entry, setEntry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [dates, setDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInput, setPageInput] = useState('');
  const [flipKey, setFlipKey] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch entry for a specific page
  const fetchEntry = useCallback(async (page) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/entries?page=${page}`);
      const data = await res.json();

      if (res.ok) {
        setEntry(data.entry);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setPageInput(String(data.currentPage));
        setFlipKey((k) => k + 1);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all dates for dropdown
  const fetchDates = useCallback(async () => {
    try {
      const res = await fetch('/api/entries/dates');
      const data = await res.json();
      if (res.ok) {
        setDates(data.dates || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEntry(1);
    fetchDates();
  }, [fetchEntry, fetchDates]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToPage = useCallback(
    (page) => {
      const p = Math.max(1, Math.min(page, totalPages));
      if (p !== currentPage) {
        fetchEntry(p);
      }
    },
    [totalPages, currentPage, fetchEntry]
  );

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      goToPage(p);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit(e);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format date short for dropdown
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render entry content with --- separators as visual breaks
  const renderContent = (content) => {
    if (!content) return null;
    const parts = content.split('\n\n---\n\n');
    return parts.map((part, i) => (
      <div key={i}>
        {i > 0 && (
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-amber-800/20" />
            <span className="text-amber-800/30 text-xs">✦</span>
            <div className="flex-1 h-px bg-amber-800/20" />
          </div>
        )}
        <div className="whitespace-pre-wrap">{part}</div>
      </div>
    ));
  };

  // Empty state
  if (!isLoading && totalPages === 0) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-6 fade-in">
        <div className="text-center space-y-6">
          <div className="text-6xl opacity-20">📖</div>
          <div>
            <h1 className="text-xl font-medium text-zinc-300 mb-2">
              Your journal is empty
            </h1>
            <p className="text-muted text-sm">
              Start writing to fill your first page.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-glow hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors duration-300"
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
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            Start writing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4 fade-in">
        <Link
          href="/"
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
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          Write
        </Link>

        <h1 className="text-sm font-medium text-zinc-400 tracking-wide">
          Journal
        </h1>

        {/* Page indicator / dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-muted hover:text-amber-glow transition-colors duration-300 text-sm flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Index
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 fade-in">
              <div className="p-2">
                <p className="text-xs text-muted px-3 py-2 uppercase tracking-wider font-medium">
                  All Entries
                </p>
                {dates.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      goToPage(item.page);
                      setShowDropdown(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors duration-200
                      flex items-center justify-between
                      ${
                        item.page === currentPage
                          ? 'bg-amber-glow/10 text-amber-glow'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                      }
                    `}
                  >
                    <span>{formatDateShort(item.date)}</span>
                    <span className="text-xs text-muted">p.{item.page}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Book page */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : (
          entry && (
            <article
              key={flipKey}
              className="book-page page-flip relative w-full max-w-2xl rounded-lg sm:rounded-xl p-6 sm:p-10 md:p-12"
            >
              {/* Date heading */}
              <header className="mb-6 sm:mb-8 pb-4 border-b border-amber-800/15">
                <p className="text-amber-800/50 text-xs uppercase tracking-widest font-sans mb-1">
                  Page {currentPage}
                </p>
                <h2 className="font-serif text-xl sm:text-2xl text-ink font-medium">
                  {formatDate(entry.date)}
                </h2>
              </header>

              {/* Entry content */}
              <div className="entry-content font-serif text-ink/90 text-base sm:text-lg leading-relaxed sm:leading-loose">
                {renderContent(entry.content)}
              </div>

              {/* Page corner fold effect */}
              <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden rounded-bl-sm">
                <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-zinc-900/10 to-transparent transform rotate-0" />
              </div>
            </article>
          )
        )}
      </div>

      {/* Navigation bar */}
      {totalPages > 0 && (
        <nav className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 px-4 sm:px-6 py-3 sm:py-4 fade-in">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`
                p-2 sm:p-2.5 rounded-lg transition-all duration-200
                ${
                  currentPage <= 1
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-amber-glow hover:bg-zinc-800/50 cursor-pointer'
                }
              `}
              aria-label="Previous page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Page jump input */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted hidden sm:inline">Page</span>
              <form onSubmit={handlePageInputSubmit} className="inline">
                <input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={handlePageInputKeyDown}
                  onBlur={handlePageInputSubmit}
                  min={1}
                  max={totalPages}
                  className="w-12 sm:w-14 text-center bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-glow/50 focus:ring-1 focus:ring-amber-glow/20 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Jump to page"
                />
              </form>
              <span className="text-muted">of {totalPages}</span>
            </div>

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`
                p-2 sm:p-2.5 rounded-lg transition-all duration-200
                ${
                  currentPage >= totalPages
                    ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-amber-glow hover:bg-zinc-800/50 cursor-pointer'
                }
              `}
              aria-label="Next page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </main>
  );
}
