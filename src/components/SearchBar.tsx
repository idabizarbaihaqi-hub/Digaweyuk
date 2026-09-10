import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onSearchSubmit?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Cari posisi, perusahaan, atau pekerjaan...',
  onSearchSubmit,
  autoFocus = false,
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-5 h-5 text-blue-600" />
      </div>
      <input
        id="main-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSearchSubmit) {
            onSearchSubmit();
          }
        }}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium rounded-2xl border border-slate-200/90 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
      />
      {value && (
        <button
          id="btn-clear-search"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          aria-label="Bersihkan pencarian"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
