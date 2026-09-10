import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CompanyProfile, User } from '../../types';
import { updateCompanyProfile } from '../../services/companyService';

interface CompanyProfileViewProps {
  company: CompanyProfile | null;
  user: User | null;
  onRefresh?: () => void;
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
  'Wilayah Lainnya (Jawa Barat)',
];

export const CompanyProfileView: React.FC<CompanyProfileViewProps> = ({
  company,
  user,
  onRefresh,
}) => {
  const companyId = company?.id || user?.uid || '';

  const [name, setName] = useState(company?.name || user?.name || '');
  const [description, setDescription] = useState(company?.description || '');
  const [industry, setIndustry] = useState(company?.industry || 'Teknologi Informasi');
  const [city, setCity] = useState(company?.city || 'Kota Bandung');
  const [address, setAddress] = useState(company?.address || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [email, setEmail] = useState(company?.email || user?.email || '');
  const [phone, setPhone] = useState(company?.phone || '');
  const [whatsapp, setWhatsapp] = useState(company?.whatsapp || '');
  const [employeeCount, setEmployeeCount] = useState(company?.employeeCount || '11 - 50 Karyawan');
  const [yearFounded, setYearFounded] = useState(company?.yearFounded || 2020);
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl || '');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      await updateCompanyProfile(companyId, {
        name: name.trim(),
        description: description.trim(),
        industry,
        province: 'Jawa Barat',
        city,
        address: address.trim(),
        website: website.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        employeeCount,
        foundedYear: String(yearFounded),
        logoUrl: logoUrl.trim(),
      });

      setStatusMessage({ type: 'success', text: 'Profil perusahaan berhasil diperbarui.' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error saving company profile:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Gagal menyimpan profil perusahaan.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-2xl overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{name || 'Nama Perusahaan'}</h2>
              {company?.verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Verifikasi Tertunda
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {industry} • {city}, Jawa Barat
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Paket</span>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black ${
              company?.subscription?.status === 'PREMIUM'
                ? 'bg-amber-400 text-slate-900'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {company?.subscription?.status === 'PREMIUM' ? 'PREMIUM MEMBER' : 'FREE TIER'}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
          Informasi Legalitas & Profil Usaha
        </h3>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Resmi Perusahaan</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: PT Teknologi Bangsa Mandiri"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bidang Industri</label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Contoh: Manufaktur, IT, Perbankan, F&B"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten (Jawa Barat)</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Skala Jumlah Karyawan</label>
            <select
              value={employeeCount}
              onChange={(e) => setEmployeeCount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="1 - 10 Karyawan">1 - 10 Karyawan</option>
              <option value="11 - 50 Karyawan">11 - 50 Karyawan</option>
              <option value="51 - 200 Karyawan">51 - 200 Karyawan</option>
              <option value="201 - 500 Karyawan">201 - 500 Karyawan</option>
              <option value="> 500 Karyawan">&gt; 500 Karyawan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Berdiri</label>
            <input
              type="number"
              value={yearFounded}
              onChange={(e) => setYearFounded(Number(e.target.value))}
              placeholder="Contoh: 2018"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">URL Logo Perusahaan (Opsional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://perusahaan.com/logo.png"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kantor Lengkap</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Jalan, Gedung, No, Kecamatan, Kelurahan"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Tentang / Deskripsi Perusahaan</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan profil perusahaan, visi, misi, dan budaya kerja..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 pt-2">
          Kontak Resmi Rekrutmen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Website Perusahaan</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://perusahaan.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi HR / Rekrutmen</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hrd@perusahaan.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telepon HR</label>
            <input
              type="text"
              value={whatsapp || phone}
              onChange={(e) => {
                setWhatsapp(e.target.value);
                setPhone(e.target.value);
              }}
              placeholder="081234567890"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
