/**
 * DIGAWE YUK - West Java Administrative Job Validator
 * Strict validation engine for jobs in West Java Province (27 Kota/Kabupaten).
 *
 * Core Rule: DATA NYATA > VALIDASI > AKURASI > JUMLAH LOWONGAN
 * Rejects jobs with:
 * - Location outside West Java (Jakarta, Tangerang, Semarang, Surabaya, etc.)
 * - Ambiguous / vague locations (Indonesia, Jawa Barat, Jabodetabek, Bandung Raya, Remote, etc.)
 * - Missing or unverifiable company address
 * - Missing company contact (no companyEmail AND no companyPhone)
 * - Fabricated or invalid sourceUrl / companyName
 */

export interface WestJavaValidationResult {
  valid: boolean;
  locationValid: boolean;
  provinceValid: boolean;
  addressValid: boolean;
  contactValid: boolean;
  companyValid: boolean;
  sourceValid: boolean;
  rejectionReason?: string;
  rejectionCategory?:
    | 'outside_west_java'
    | 'no_address'
    | 'no_contact'
    | 'invalid_company'
    | 'invalid_source'
    | 'vague_location'
    | 'other';
  identifiedCity?: string;
  identifiedProvince?: string;
  normalizedAddress?: string;
  normalizedEmail?: string | null;
  normalizedPhone?: string | null;
  contactType?: 'email' | 'phone' | 'both';
}

/**
 * 27 Official Administrative Cities & Regencies in West Java Province
 */
export interface WestJavaAdminEntity {
  type: 'Kota' | 'Kabupaten';
  officialName: string;
  primaryName: string;
  keywords: string[];
}

export const WEST_JAVA_ENTITIES: WestJavaAdminEntity[] = [
  {
    type: 'Kota',
    officialName: 'Kota Bandung',
    primaryName: 'Bandung',
    keywords: [
      'kota bandung',
      'bandung',
      'bdg',
      'pasteur',
      'dago',
      'gedebage',
      'buahbatu',
      'cibiru',
      'sukajadi',
      'kiaracondong',
      'ujungberung',
      'antapani',
      'arcamanik',
      'astanaanyar',
      'batununggal',
      'cidadap',
      'coblong',
      'sumur bandung',
      'cicendo',
      'andir',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Bandung',
    primaryName: 'Kabupaten Bandung',
    keywords: [
      'kabupaten bandung',
      'kab. bandung',
      'soreang',
      'baleendah',
      'dayeuhkolot',
      'majalaya',
      'ciwidey',
      'rancaekek',
      'cicalengka',
      'banjaran',
      'katapang',
      'margahayu',
      'cileunyi',
      'ciparay',
      'pangalengan',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Cimahi',
    primaryName: 'Cimahi',
    keywords: ['kota cimahi', 'cimahi', 'leuwigajah', 'baros', 'melong'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Bandung Barat',
    primaryName: 'Bandung Barat',
    keywords: [
      'kabupaten bandung barat',
      'kab. bandung barat',
      'bandung barat',
      'kbb',
      'padalarang',
      'lembang',
      'ngamprah',
      'batujajar',
      'parongpong',
      'cililin',
      'cisarua lembang',
      'cipatat',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Sumedang',
    primaryName: 'Sumedang',
    keywords: [
      'kabupaten sumedang',
      'kab. sumedang',
      'sumedang',
      'jatinangor',
      'tanjungsari',
      'cimalaka',
      'cimanggung',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Garut',
    primaryName: 'Garut',
    keywords: [
      'kabupaten garut',
      'kab. garut',
      'garut',
      'tarogong',
      'samarang',
      'leles',
      'kadungora',
      'limbangan',
      'wanaraja',
      'karangpawitan',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Cianjur',
    primaryName: 'Cianjur',
    keywords: [
      'kabupaten cianjur',
      'kab. cianjur',
      'cianjur',
      'cipanas',
      'pacet cianjur',
      'sukaluyu',
      'ciranjang',
      'cugenang',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Sukabumi',
    primaryName: 'Kota Sukabumi',
    keywords: ['kota sukabumi', 'cikole sukabumi', 'gunungpuyuh', 'citamiang'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Sukabumi',
    primaryName: 'Sukabumi',
    keywords: [
      'kabupaten sukabumi',
      'kab. sukabumi',
      'sukabumi',
      'cibadak',
      'cicurug',
      'palabuhanratu',
      'pelabuhan ratu',
      'cisaat',
      'parungkuda',
      'cikembar',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Bogor',
    primaryName: 'Kota Bogor',
    keywords: [
      'kota bogor',
      'bogor tengah',
      'bogor timur',
      'bogor barat',
      'bogor utara',
      'bogor selatan',
      'tanah sareal',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Bogor',
    primaryName: 'Bogor',
    keywords: [
      'kabupaten bogor',
      'kab. bogor',
      'bogor',
      'cibinong',
      'cileungsi',
      'gunung putri',
      'citeureup',
      'jonggol',
      'bojonggede',
      'babakan madang',
      'sentul',
      'parung',
      'ciawi',
      'megamendung',
      'cisarua bogor',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Depok',
    primaryName: 'Depok',
    keywords: [
      'kota depok',
      'depok',
      'margonda',
      'sawangan',
      'cinere',
      'sukmajaya',
      'cimanggis',
      'beji',
      'limo depok',
      'cilodong',
      'tapos',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Bekasi',
    primaryName: 'Kota Bekasi',
    keywords: [
      'kota bekasi',
      'bekasi barat',
      'bekasi timur',
      'bekasi utara',
      'bekasi selatan',
      'rawallumbu',
      'pondok gede',
      'jatiasih',
      'medan satria',
      'bantar gebang',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Bekasi',
    primaryName: 'Bekasi',
    keywords: [
      'kabupaten bekasi',
      'kab. bekasi',
      'bekasi',
      'cikarang',
      'cikarang barat',
      'cikarang timur',
      'cikarang utara',
      'cikarang selatan',
      'cikarang pusat',
      'cibitung',
      'tambun',
      'tambun selatan',
      'tambun utara',
      'setu bekasi',
      'tarumajaya',
      'babelan',
      'jababeka',
      'ejip',
      'mm2100',
      'giic',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Karawang',
    primaryName: 'Karawang',
    keywords: [
      'kabupaten karawang',
      'kab. karawang',
      'karawang',
      'cikampek',
      'telukjambe',
      'telukjambe timur',
      'telukjambe barat',
      'karawang barat',
      'karawang timur',
      'klari',
      'kiic',
      'surya cipta',
      'indotaisei',
      'rengasdengklok',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Purwakarta',
    primaryName: 'Purwakarta',
    keywords: [
      'kabupaten purwakarta',
      'kab. purwakarta',
      'purwakarta',
      'jatiluhur',
      'campaka purwakarta',
      'bungursari',
      'bukit indah kota bukit indah',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Subang',
    primaryName: 'Subang',
    keywords: [
      'kabupaten subang',
      'kab. subang',
      'subang',
      'kalijati',
      'patimban',
      'pagaden',
      'purwadadi subang',
      'jalancagak',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Indramayu',
    primaryName: 'Indramayu',
    keywords: [
      'kabupaten indramayu',
      'kab. indramayu',
      'indramayu',
      'jatibarang',
      'haurgeulis',
      'patrol indramayu',
      'balongan',
    ],
  },
  {
    type: 'Kota',
    officialName: 'Kota Cirebon',
    primaryName: 'Kota Cirebon',
    keywords: ['kota cirebon', 'kejaksan', 'kesambi', 'lemahwungkuk', 'harjamukti', 'pekalipan'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Cirebon',
    primaryName: 'Cirebon',
    keywords: [
      'kabupaten cirebon',
      'kab. cirebon',
      'cirebon',
      'sumber cirebon',
      'kedawung',
      'weru cirebon',
      'palimanan',
      'arjawinangun',
      'plumbon',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Majalengka',
    primaryName: 'Majalengka',
    keywords: [
      'kabupaten majalengka',
      'kab. majalengka',
      'majalengka',
      'kertajati',
      'jatiwangi',
      'dawuan majalengka',
      'kadipaten majalengka',
    ],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Kuningan',
    primaryName: 'Kuningan',
    keywords: ['kabupaten kuningan', 'kab. kuningan', 'kuningan jabar', 'kuningan jawa barat', 'cilimus', 'jalaksana', 'cigugur'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Ciamis',
    primaryName: 'Ciamis',
    keywords: ['kabupaten ciamis', 'kab. ciamis', 'ciamis', 'banjarsari ciamis', 'kawali'],
  },
  {
    type: 'Kota',
    officialName: 'Kota Banjar',
    primaryName: 'Banjar',
    keywords: ['kota banjar', 'banjar patroman', 'pataruman banjar', 'purwaharja'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Pangandaran',
    primaryName: 'Pangandaran',
    keywords: ['kabupaten pangandaran', 'kab. pangandaran', 'pangandaran', 'parigi pangandaran', 'kalipucang'],
  },
  {
    type: 'Kota',
    officialName: 'Kota Tasikmalaya',
    primaryName: 'Kota Tasikmalaya',
    keywords: ['kota tasikmalaya', 'cihideung', 'cipedes', 'indihiang', 'kawalu', 'mangkubumi', 'tawang tasik'],
  },
  {
    type: 'Kabupaten',
    officialName: 'Kabupaten Tasikmalaya',
    primaryName: 'Tasikmalaya',
    keywords: ['kabupaten tasikmalaya', 'kab. tasikmalaya', 'tasikmalaya', 'singaparna', 'manonjaya', 'rajapolah'],
  },
];

/**
 * Explicit Non-West Java locations that must be rejected
 */
export const FORBIDDEN_OUTSIDE_REGIONS = [
  'jakarta',
  'dki jakarta',
  'jakarta pusat',
  'jakarta selatan',
  'jakarta barat',
  'jakarta timur',
  'jakarta utara',
  'tangerang',
  'kota tangerang',
  'tangerang selatan',
  'tangsel',
  'banten',
  'serang',
  'cilegon',
  'lebak',
  'pandeglang',
  'jawa tengah',
  'jateng',
  'semarang',
  'surakarta',
  'solo',
  'banyumas',
  'purwokerto',
  'cilacap',
  'magelang',
  'pekalongan',
  'tegal',
  'brebes',
  'kudus',
  'pati',
  'jepara',
  'demak',
  'kendal',
  'klaten',
  'boyolali',
  'salatiga',
  'yogyakarta',
  'jogja',
  'diy',
  'sleman',
  'bantul',
  'jawa timur',
  'jatim',
  'surabaya',
  'malang',
  'sidoarjo',
  'gresik',
  'pasuruan',
  'mojokerto',
  'kediri',
  'jember',
  'banyuwangi',
  'madiun',
  'bali',
  'denpasar',
  'medan',
  'sumatera',
  'makassar',
  'sulawesi',
  'kalimantan',
  'balikpapan',
  'samarinda',
  'pontianak',
  'banjarmasin',
  'batam',
  'pekanbaru',
  'palembang',
  'lampung',
];

/**
 * Ambiguous/vague locations that cannot be mapped to a specific West Java regency/city
 */
export const VAGUE_LOCATIONS = [
  'indonesia',
  'jawa barat',
  'jabar',
  'provinsi jawa barat',
  'bandung raya',
  'area jawa barat',
  'jabodetabek',
  'jabodetabekpunjur',
  'remote',
  'hybrid',
  'lokasi fleksibel',
  'fleksibel',
  'wfa',
  'wfh',
  'anywhere',
  'seluruh indonesia',
  'seluruh jabar',
];

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Phone number pattern (Indonesian telephone / mobile / landline)
 */
const PHONE_REGEX = /^(?:\+62|62|0)(?:2\d|8\d|9\d)\d{6,11}$/;

/**
 * Check if a phone string is reasonably formatted
 */
function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  // Clean separators: space, dash, parentheses, dot
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.length < 8 || cleaned.length > 15) return false;
  // Exclude dummy numbers like 08123456789, 00000000, 12345678
  if (/^012345678|^0812345678|^000000|^111111|^999999/.test(cleaned)) return false;
  return PHONE_REGEX.test(cleaned);
}

/**
 * Check if an email is realistic and non-dummy
 */
function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return false;
  // Exclude dummy domains
  const dummyDomains = ['example.com', 'test.com', 'dummy.com', 'sample.com', 'domain.com', 'perusahaan.com'];
  const domain = trimmed.split('@')[1];
  if (dummyDomains.includes(domain)) return false;
  return true;
}

/**
 * Check whether address looks like a real physical address
 */
function isValidCompanyAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 10) return false;

  const lower = trimmed.toLowerCase();
  // Exclude generic placeholder text
  if (
    lower === 'jawa barat' ||
    lower === 'indonesia' ||
    lower === 'alamat kantor' ||
    lower === 'tidak ada' ||
    lower === 'remote' ||
    lower === 'hybrid' ||
    lower === 'sesuai penempatan' ||
    lower === 'alamat perusahaan'
  ) {
    return false;
  }

  // Address should contain indicators of real physical location:
  // e.g., 'jl', 'jalan', 'no', 'blok', 'rt', 'rw', 'komplek', 'kawasan', 'gedung', 'plaza', 'tower', 'lantai', 'kecamatan', 'kelurahan', 'desa', or one of the regencies
  const physicalKeywords = [
    'jl',
    'jalan',
    'no.',
    'nomor',
    'blok',
    'rt',
    'rw',
    'komplek',
    'kawasan',
    'gedung',
    'tower',
    'lt.',
    'lantai',
    'ruko',
    'industri',
    'kec.',
    'kecamatan',
    'kel.',
    'kelurahan',
    'desa',
    'km',
    'bandung',
    'bekasi',
    'bogor',
    'cimahi',
    'depok',
    'karawang',
    'purwakarta',
    'subang',
    'sukabumi',
    'cianjur',
    'garut',
    'tasikmalaya',
    'cirebon',
    'sumedang',
    'majalengka',
    'kuningan',
    'ciamis',
    'banjar',
    'pangandaran',
    'indramayu',
  ];

  const hasPhysicalKeyword = physicalKeywords.some((kw) => lower.includes(kw));
  return hasPhysicalKeyword;
}

/**
 * Validate source URL (must be valid HTTP/HTTPS URL and not dummy)
 */
function isValidSourceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'example.com' ||
      host === 'test.com' ||
      host === 'mysite.com' ||
      host === 'placeholder.com' ||
      host === 'localhost' ||
      host === 'dummy.com'
    ) {
      return false;
    }
    return parsed.pathname.length >= 1;
  } catch {
    return false;
  }
}

/**
 * Match a text string to a specific West Java administrative entity
 */
export function identifyWestJavaLocation(locationStr: string, addressStr?: string): WestJavaAdminEntity | null {
  const combined = `${locationStr || ''} ${addressStr || ''}`.toLowerCase().trim();

  // First verify it's not explicitly outside
  for (const forbidden of FORBIDDEN_OUTSIDE_REGIONS) {
    // Only match whole-word or delimited forbidden location
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (regex.test(combined)) {
      // Special case: Kuningan inside West Java vs Kuningan Jakarta
      if (forbidden === 'jakarta' && combined.includes('kuningan')) {
        return null; // Jakarta Kuningan, reject
      }
      return null;
    }
  }

  // Reject pure vague locations if alone
  const locLower = (locationStr || '').toLowerCase().trim();
  if (VAGUE_LOCATIONS.includes(locLower) && !addressStr) {
    return null;
  }

  // Iterate over 27 administrative entities in specific priority (Kota before Kabupaten if ambiguous)
  for (const entity of WEST_JAVA_ENTITIES) {
    for (const kw of entity.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        return entity;
      }
    }
  }

  return null;
}

/**
 * Master Validation Function for West Java Jobs
 *
 * Rules:
 * 1. province == 'Jawa Barat' (must not be outside)
 * 2. city must clearly belong to one of 27 West Java Kota/Kabupaten
 * 3. companyAddress must exist and be verifiable
 * 4. companyEmail OR companyPhone (or both) must exist and be valid
 * 5. sourceUrl must be a real, valid URL
 * 6. companyName must be valid
 */
export function validateWestJavaJob(jobData: any): WestJavaValidationResult {
  const title = (jobData.title || '').trim();
  const companyName = (jobData.companyName || jobData.company || '').trim();
  const locationRaw = (jobData.location || '').trim();
  const provinceRaw = (jobData.province || 'Jawa Barat').trim();
  const cityRaw = (jobData.city || '').trim();
  const addressRaw = (jobData.companyAddress || '').trim();
  const emailRaw = (jobData.companyEmail || null);
  const phoneRaw = (jobData.companyPhone || null);
  const sourceUrl = (jobData.sourceUrl || '').trim();

  // 1. Company Name validation
  if (!companyName || companyName.length < 2) {
    return {
      valid: false,
      companyValid: false,
      locationValid: false,
      provinceValid: false,
      addressValid: false,
      contactValid: false,
      sourceValid: false,
      rejectionReason: 'Nama perusahaan kosong atau tidak valid.',
      rejectionCategory: 'invalid_company',
    };
  }

  // 2. Province Check
  const combinedLoc = `${locationRaw} ${provinceRaw} ${cityRaw} ${addressRaw}`.toLowerCase();
  const isOutsideWestJava = FORBIDDEN_OUTSIDE_REGIONS.some((outside) => {
    const reg = new RegExp(`\\b${outside}\\b`, 'i');
    return reg.test(combinedLoc);
  });

  if (isOutsideWestJava) {
    return {
      valid: false,
      provinceValid: false,
      locationValid: false,
      companyValid: true,
      addressValid: false,
      contactValid: false,
      sourceValid: false,
      rejectionReason: `Lokasi terdeteksi di luar Provinsi Jawa Barat (${locationRaw || cityRaw}).`,
      rejectionCategory: 'outside_west_java',
    };
  }

  // 3. Location Identification (Must map to one of 27 West Java regions)
  const identifiedEntity = identifyWestJavaLocation(
    `${cityRaw} ${locationRaw}`,
    addressRaw
  );

  if (!identifiedEntity) {
    const isVague = VAGUE_LOCATIONS.some((v) => combinedLoc.includes(v));
    return {
      valid: false,
      locationValid: false,
      provinceValid: true,
      companyValid: true,
      addressValid: false,
      contactValid: false,
      sourceValid: false,
      rejectionReason: isVague
        ? `Lokasi (${locationRaw || 'Tidak spesifik'}) terlalu umum/tidak spesifik. Wajib mencantumkan kota/kabupaten di Jawa Barat.`
        : `Lokasi pekerjaan (${locationRaw || cityRaw}) tidak dapat diverifikasi dalam 27 wilayah administratif Jawa Barat.`,
      rejectionCategory: isVague ? 'vague_location' : 'outside_west_java',
    };
  }

  // 4. Company Address Check (MANDATORY)
  const isAddressValid = isValidCompanyAddress(addressRaw);
  if (!isAddressValid) {
    return {
      valid: false,
      addressValid: false,
      locationValid: true,
      provinceValid: true,
      companyValid: true,
      contactValid: false,
      sourceValid: false,
      identifiedCity: identifiedEntity.officialName,
      identifiedProvince: 'Jawa Barat',
      rejectionReason: 'Alamat fisik kantor/perusahaan tidak lengkap atau tidak ditemukan dari sumber terpercaya.',
      rejectionCategory: 'no_address',
    };
  }

  // 5. Contact Check (Email OR Phone is MANDATORY)
  const isEmailValid = emailRaw ? isValidEmail(emailRaw) : false;
  const isPhoneValid = phoneRaw ? isValidPhoneNumber(phoneRaw) : false;

  if (!isEmailValid && !isPhoneValid) {
    return {
      valid: false,
      contactValid: false,
      addressValid: true,
      locationValid: true,
      provinceValid: true,
      companyValid: true,
      sourceValid: false,
      identifiedCity: identifiedEntity.officialName,
      identifiedProvince: 'Jawa Barat',
      rejectionReason: 'Kontak resmi perusahaan (email atau nomor telepon) tidak ditemukan atau tidak valid.',
      rejectionCategory: 'no_contact',
    };
  }

  let contactType: 'email' | 'phone' | 'both' = 'email';
  if (isEmailValid && isPhoneValid) {
    contactType = 'both';
  } else if (isPhoneValid) {
    contactType = 'phone';
  }

  // 6. Source URL Check (MANDATORY)
  const isSourceValid = isValidSourceUrl(sourceUrl);
  if (!isSourceValid) {
    return {
      valid: false,
      sourceValid: false,
      contactValid: true,
      addressValid: true,
      locationValid: true,
      provinceValid: true,
      companyValid: true,
      identifiedCity: identifiedEntity.officialName,
      identifiedProvince: 'Jawa Barat',
      rejectionReason: 'Tautan URL sumber pendaftaran tidak valid atau tidak dapat diakses.',
      rejectionCategory: 'invalid_source',
    };
  }

  // All 6 core criteria passed!
  return {
    valid: true,
    locationValid: true,
    provinceValid: true,
    addressValid: true,
    contactValid: true,
    companyValid: true,
    sourceValid: true,
    identifiedCity: identifiedEntity.officialName,
    identifiedProvince: 'Jawa Barat',
    normalizedAddress: addressRaw.trim(),
    normalizedEmail: isEmailValid ? emailRaw.trim().toLowerCase() : null,
    normalizedPhone: isPhoneValid ? phoneRaw.trim() : null,
    contactType,
  };
}
