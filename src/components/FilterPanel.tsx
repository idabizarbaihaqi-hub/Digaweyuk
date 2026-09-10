import React from 'react';
import { MapPin, Briefcase, RotateCcw } from 'lucide-react';
import { LOCATIONS, CATEGORIES } from '../constants/jobFilters';

interface FilterPanelProps {
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedLocation,
  onSelectLocation,
  selectedCategory,
  onSelectCategory,
  onReset,
}) => {
  const hasActiveFilter =
    selectedLocation !== 'Semua Lokasi' || selectedCategory !== 'Semua Kategori';

  return (
    <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
      {/* Header filter & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Filter Lowongan
          </span>
          {hasActiveFilter && (
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          )}
        </div>
        {hasActiveFilter && (
          <button
            id="btn-reset-filters"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filter
          </button>
        )}
      </div>

      {/* Filter Lokasi: Dropdown & Quick Badges */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Lokasi</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {LOCATIONS.slice(0, 6).map((loc) => {
            const active = selectedLocation === loc;
            return (
              <button
                key={loc}
                id={`filter-location-${loc.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectLocation(loc)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
        {/* Full selector for more locations */}
        <select
          id="select-all-locations"
          value={selectedLocation}
          onChange={(e) => onSelectLocation(e.target.value)}
          aria-label="Pilih Lokasi Selengkapnya"
          className="mt-1.5 w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc === 'Semua Lokasi' ? 'Semua Lokasi Indonesia' : loc}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Kategori: Scrollable Pills */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kategori Pekerjaan</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
