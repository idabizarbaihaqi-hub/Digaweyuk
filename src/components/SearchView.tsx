import React from 'react';
import { Search, Briefcase, Frown, AlertCircle } from 'lucide-react';
import { Job, SubscriptionStatus } from '../types';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { JobCard } from './JobCard';

interface SearchViewProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  subscriptionStatus: SubscriptionStatus;
  savedJobIds: Set<string>;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onResetFilters: () => void;
  onSelectJob: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onTriggerPremiumModal: (title: string, desc: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  jobs,
  loading,
  error,
  subscriptionStatus,
  savedJobIds,
  searchQuery,
  onSearchChange,
  selectedLocation,
  onSelectLocation,
  selectedCategory,
  onSelectCategory,
  onResetFilters,
  onSelectJob,
  onToggleSave,
  onTriggerPremiumModal,
}) => {
  // Filter logic based on Firestore jobs: title, company, location, category
  const filteredJobs = jobs.filter((job) => {
    // Search query match on title & company as requested
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchCompany = job.company.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) {
        return false;
      }
    }

    // Location match
    if (selectedLocation !== 'Semua Lokasi') {
      if (job.location.toLowerCase() !== selectedLocation.toLowerCase()) {
        return false;
      }
    }

    // Category match
    if (selectedCategory !== 'Semua Kategori') {
      if (job.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  return (
    <div id="search-view-container" className="space-y-4 max-w-2xl mx-auto px-4 pt-3 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span>🔎 Cari Pekerjaan</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Pencarian langsung dari data Cloud Firestore.
        </p>
      </div>

      {/* Search Bar Input */}
      <div>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Contoh: Admin, Operator, Marketing..."
        />
      </div>

      {/* Filter Panel (Lokasi & Kategori) */}
      <FilterPanel
        selectedLocation={selectedLocation}
        onSelectLocation={onSelectLocation}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        onReset={onResetFilters}
      />

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Terjadi kesalahan saat mengambil data: {error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">Memuat lowongan...</p>
        </div>
      ) : jobs.length === 0 ? (
        /* Entire collection is empty */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Belum ada lowongan terbaru yang berhasil ditemukan.
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Sistem AI Job Hunter akan melakukan pencarian lowongan terverifikasi terbaru secara berkala.
          </p>
        </div>
      ) : (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs font-bold text-slate-700">
              Ditemukan {filteredJobs.length} Lowongan
            </span>
            {(selectedLocation !== 'Semua Lokasi' ||
              selectedCategory !== 'Semua Kategori' ||
              searchQuery) && (
              <span className="text-[11px] text-blue-600 font-semibold">
                Filter diterapkan
              </span>
            )}
          </div>

          {/* If search/filter produces 0 results: "Lowongan tidak ditemukan." as requested */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Frown className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Lowongan tidak ditemukan.
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Coba ubah kata kunci posisi/perusahaan atau reset filter lokasi dan kategori.
              </p>
              <button
                id="btn-reset-empty-search"
                onClick={onResetFilters}
                className="mt-3.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  subscriptionStatus={subscriptionStatus}
                  isSaved={savedJobIds.has(job.id)}
                  onSelectJob={onSelectJob}
                  onToggleSave={onToggleSave}
                  onTriggerPremiumModal={onTriggerPremiumModal}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
