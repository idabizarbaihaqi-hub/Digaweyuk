import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Loader2,
  X,
  Building2,
} from 'lucide-react';
import { CompanyProfile, Job, User } from '../../types';
import { getCompanyJobs, createCompanyJob } from '../../services/companyService';

interface CompanyJobsViewProps {
  company: CompanyProfile | null;
  user: User | null;
  onOpenUpgradeModal: () => void;
  onSelectJobForPipeline: (jobId: string) => void;
}

const JAWA_BARAT_CITIES = [
  'Kota Bandung',
  'Kabupaten Bandung',
  'Kabupaten Bandung Barat',
  'Kota Cimahi',
  'Kabupaten Bekasi',
  'Kota Bekasi',
  'Kabupaten Bogor',
  'Kota Bogor',
  'Kota Depok',
  'Kabupaten Karawang',
  'Kabupaten Purwakarta',
  'Kabupaten Subang',
  'Kabupaten Sukabumi',
  'Kota Sukabumi',
  'Kabupaten Cianjur',
  'Kabupaten Garut',
  'Kabupaten Tasikmalaya',
  'Kota Tasikmalaya',
  'Kabupaten Ciamis',
  'Kota Banjar',
  'Kabupaten Pangandaran',
  'Kabupaten Cirebon',
  'Kota Cirebon',
  'Kabupaten Indramayu',
  'Kabupaten Majalengka',
  'Kabupaten Kuningan',
];

export const CompanyJobsView: React.FC<CompanyJobsViewProps> = ({
  company,
  user,
  onOpenUpgradeModal,
  onSelectJobForPipeline,
}) => {
  const companyId = company?.id || user?.uid || '';
  const companyName = company?.name || user?.companyName || user?.name || 'Perusahaan';
  const isPremium = company?.subscription?.status === 'PREMIUM';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for new job
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Teknologi & IT');
  const [employmentType, setEmploymentType] = useState('Full Time');
  const [city, setCity] = useState('Kota Bandung');
  const [locationType, setLocationType] = useState('On-site');
  const [experienceLevel, setExperienceLevel] = useState('1 - 3 Tahun');
  const [educationLevel, setEducationLevel] = useState('S1');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [isSalaryNegotiable, setIsSalaryNegotiable] = useState(false);
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const list = await getCompanyJobs(companyId);
      setJobs(list || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [companyId]);

  const handleOpenCreateModal = () => {
    // Check Free tier limitation (max 3 active jobs)
    const activeJobsCount = jobs.filter((j) => j.status === 'active').length;
    if (!isPremium && activeJobsCount >= 3) {
      onOpenUpgradeModal();
      return;
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    if (!title.trim() || !description.trim()) {
      setFormError('Judul posisi dan deskripsi pekerjaan wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const requirements = requirementsText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const responsibilities = responsibilitiesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    let salaryStr = 'Dinegosiasikan';
    if (!isSalaryNegotiable && salaryMin && salaryMax) {
      salaryStr = `Rp ${Number(salaryMin).toLocaleString('id-ID')} - Rp ${Number(salaryMax).toLocaleString('id-ID')}`;
    } else if (!isSalaryNegotiable && salaryMin) {
      salaryStr = `Rp ${Number(salaryMin).toLocaleString('id-ID')}`;
    }

    try {
      await createCompanyJob(companyId, companyName, {
        title: title.trim(),
        category,
        employmentType,
        city,
        province: 'Jawa Barat',
        location: `${city}, Jawa Barat`,
        workModel: locationType === 'Remote' ? 'remote' : locationType === 'Hybrid' ? 'hybrid' : 'onsite',
        experience: experienceLevel,
        education: educationLevel,
        salary: salaryStr,
        description: description.trim(),
        requirements: requirements.length > 0 ? requirements : ['Pendidikan relevan', 'Kemampuan komunikasi baik'],
        responsibilities,
        deadline: deadline || undefined,
      });

      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setRequirementsText('');
      setResponsibilitiesText('');
      setSalaryMin('');
      setSalaryMax('');
      await fetchJobs();
    } catch (err: any) {
      console.error('Error creating job:', err);
      setFormError(err?.message || 'Gagal mempublikasikan lowongan pekerjaan.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Manajemen Lowongan Kerja</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publikasikan dan kelola lowongan resmi perusahaan Anda di wilayah Jawa Barat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isPremium && (
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Kuota Free: <span className="text-blue-700 font-extrabold">{jobs.length}/3</span> Lowongan
            </div>
          )}
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pasang Lowongan Baru</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Cari lowongan berdasarkan posisi atau kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs text-slate-900 bg-transparent border-none focus:outline-none"
        />
      </div>

      {/* Job Vacancies List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-medium">Memuat daftar lowongan...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-900 mb-1">Belum ada data lowongan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Perusahaan Anda belum memasang lowongan pekerjaan aktif. Pasang lowongan sekarang untuk mulai menerima pelamar.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-md hover:bg-blue-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pasang Lowongan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{job.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.city || 'Jawa Barat'}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {job.type || job.employmentType || 'Full Time'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AKTIF
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] text-slate-500 font-medium">
                  <div>
                    Gaji: <strong className="text-slate-900">{job.salary || 'Dinegosiasikan'}</strong>
                  </div>
                  <div>
                    Pengalaman: <strong className="text-slate-900">{job.experience || 'Semua Level'}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Diposting: {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('id-ID') : 'Baru saja'}
                </span>

                <button
                  onClick={() => onSelectJobForPipeline(job.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Lihat Pelamar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Lowongan Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Lowongan Resmi Perusahaan</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">Pasang Lowongan Pekerjaan Baru</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lowongan yang dipasang akan langsung diverifikasi dan tayang di DIGAWE YUK Jawa Barat.
              </p>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Posisi / Judul Pekerjaan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Digital Marketing Specialist, Quality Control, Admin"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pekerjaan</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Teknologi & IT">Teknologi &amp; IT</option>
                    <option value="Manufaktur & Produksi">Manufaktur &amp; Produksi</option>
                    <option value="Administrasi & Operasional">Administrasi &amp; Operasional</option>
                    <option value="Pemasaran & Penjualan">Pemasaran &amp; Penjualan</option>
                    <option value="Keuangan & Akuntansi">Keuangan &amp; Akuntansi</option>
                    <option value="F&B & Perhotelan">F&amp;B &amp; Perhotelan</option>
                    <option value="Kesehatan & Farmasi">Kesehatan &amp; Farmasi</option>
                    <option value="Logistik & Transportasi">Logistik &amp; Transportasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Pekerjaan</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Kontrak / PKWT</option>
                    <option value="Internship">Magang / Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Kabupaten Penempatan (Jawa Barat)
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {JAWA_BARAT_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Kerja</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="On-site">On-site (Di Kantor/Pabrik)</option>
                    <option value="Hybrid">Hybrid (Kombinasi)</option>
                    <option value="Remote">Remote (Kerja Jarak Jauh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pengalaman Minimal</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Fresh Graduate">Fresh Graduate / Tanpa Pengalaman</option>
                    <option value="1 - 3 Tahun">1 - 3 Tahun</option>
                    <option value="3 - 5 Tahun">3 - 5 Tahun</option>
                    <option value="> 5 Tahun">&gt; 5 Tahun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Minimal</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="SMA/SMK">SMA / SMK Sederajat</option>
                    <option value="D3">Diploma (D3)</option>
                    <option value="S1">Sarjana (S1 / D4)</option>
                    <option value="S2">Magister (S2)</option>
                    <option value="Semua Jenjang">Semua Jenjang Pendidikan</option>
                  </select>
                </div>
              </div>

              {/* Salary Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Kisaran Gaji Bulanan (IDR)</label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSalaryNegotiable}
                      onChange={(e) => setIsSalaryNegotiable(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Gaji Dinegosiasikan / Rahasia</span>
                  </label>
                </div>
                {!isSalaryNegotiable && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Gaji Min (misal: 4500000)"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Gaji Max (misal: 6500000)"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Singkat Pekerjaan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan peran pekerjaan dan gambaran umum posisi ini..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kualifikasi &amp; Persyaratan (1 baris per poin)
                </label>
                <textarea
                  rows={3}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  placeholder="Contoh:&#10;Menguasai React & TypeScript&#10;Mampu berbahasa Inggris aktif&#10;Disiplin dan teliti"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggung Jawab Utama (1 baris per poin)
                </label>
                <textarea
                  rows={2}
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  placeholder="Contoh:&#10;Mengembangkan fitur aplikasi&#10;Melakukan review kode secara berkala"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publikasikan Lowongan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
