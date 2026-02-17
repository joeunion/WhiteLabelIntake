"use client";

import { useState, useCallback, useEffect } from "react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export function SearchBar({ placeholder = "Search...", onSearch, debounceMs = 300 }: SearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="
        w-full max-w-sm bg-white
        border-[1.5px] border-border
        rounded-[var(--radius-input)]
        px-4 py-2.5
        text-sm text-foreground
        placeholder:text-gray-medium/50
        focus:border-focus focus:ring-0 focus:outline-none
        transition-colors duration-150
      "
    />
  );
}
