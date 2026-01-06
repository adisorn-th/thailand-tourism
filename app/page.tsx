"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Info, Compass, X, Type, ChevronLeft, AlertCircle, Plus, Minus, Search, Sparkles, Play, Pause, Share2, Layers, Languages } from 'lucide-react';

// --- TYPE DEFINITIONS ---
declare global {
  interface Window {
    d3: any; // Using D3 from CDN
  }
}

interface RegionInfo {
  name: string;
  color: string;
  textColor: string;
  description: string;
  provinces: string[];
}

interface RegionConfig {
  [key: string]: RegionInfo;
}

interface GeoJSONProperties {
  name_th?: string;
  ap_th?: string;
  AMP_NAM_T?: string;
  PROV_NAM_T?: string;
  NAME_1?: string;
  NAME_2?: string;
  NAME_3?: string;
  NL_NAME_1?: string;
  NL_NAME_2?: string;
  NL_NAME_3?: string;
  name?: string;
  province_th?: string;
  pro_th?: string;
  [key: string]: any;
}

interface GeoJSONFeature {
  type: "Feature";
  properties: GeoJSONProperties;
  geometry: any;
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface SelectedProvince {
  name: string;
  region: string;
  properties: GeoJSONProperties;
}

interface SelectedAmphoe {
  name: string;
  properties: GeoJSONProperties;
}

interface SelectedTambon {
  name: string;
  properties: GeoJSONProperties;
}

interface ProvinceEntry {
  provinceCode: number;
  provinceNameEn: string;
  provinceNameTh: string;
}

interface DistrictEntry {
  provinceCode: number;
  districtCode: number;
  districtNameEn: string;
  districtNameTh: string;
  postalCode?: number;
}

interface SubdistrictEntry {
  provinceCode: number;
  districtCode: number;
  subdistrictCode: number;
  subdistrictNameEn: string;
  subdistrictNameTh: string;
  postalCode?: number;
}

interface PostcodeData {
  provinces: ProvinceEntry[];
  districts: DistrictEntry[];
  subdistricts: SubdistrictEntry[];
}

interface SearchResult {
  id: string;
  type: 'province' | 'amphoe' | 'tambon';
  label: string;
  sublabel?: string;
  provinceName: string;
  amphoeName?: string;
  tambonName?: string;
}

interface SearchIndexItem {
  id: string;
  type: 'province' | 'amphoe' | 'tambon';
  labelTh: string;
  labelEn: string;
  sublabelTh?: string;
  sublabelEn?: string;
  provinceName: string;
  amphoeName?: string;
  tambonName?: string;
  searchKey: string;
}

interface TambonListItem {
  nameTh: string;
  nameEn: string;
  postalCodes: string[];
}

type Language = 'TH' | 'EN';

// --- CONFIGURATION ---
const REGION_CONFIG: RegionConfig = {
  "North": { name: "ภาคเหนือ", color: "#16A34A", textColor: "#FFFFFF", description: "ดินแดนแห่งขุนเขา ทะเลหมอก และวัฒนธรรมล้านนา", provinces: ["เชียงราย", "เชียงใหม่", "น่าน", "พะเยา", "แพร่", "แม่ฮ่องสอน", "ลำปาง", "ลำพูน", "อุตรดิตถ์"] },
  "Northeast": { name: "ภาคตะวันออกเฉียงเหนือ", color: "#EA580C", textColor: "#FFFFFF", description: "ดินแดนที่ราบสูง แหล่งไดโนเสาร์ และอารยธรรมขอม", provinces: ["กาฬสินธุ์", "ขอนแก่น", "ชัยภูมิ", "นครพนม", "นครราชสีมา", "บึงกาฬ", "บุรีรัมย์", "มหาสารคาม", "มุกดาหาร", "ยโสธร", "ร้อยเอ็ด", "เลย", "สกลนคร", "สุรินทร์", "ศรีสะเกษ", "หนองคาย", "หนองบัวลำภู", "อุดรธานี", "อุบลราชธานี", "อำนาจเจริญ"] },
  "Central": { name: "ภาคกลาง", color: "#DB2777", textColor: "#FFFFFF", description: "อู่ข้าวอู่น้ำ พื้นที่ราบลุ่มแม่น้ำเจ้าพระยา", provinces: ["กรุงเทพมหานคร", "กรุงเทพฯ", "กำแพงเพชร", "ชัยนาท", "นครนายก", "นครปฐม", "นครสวรรค์", "นนทบุรี", "ปทุมธานี", "พระนครศรีอยุธยา", "พิจิตร", "พิษณุโลก", "เพชรบูรณ์", "ลพบุรี", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "อ่างทอง", "อุทัยธานี"] },
  "East": { name: "ภาคตะวันออก", color: "#0891B2", textColor: "#FFFFFF", description: "ประตูสู่เศรษฐกิจโลก สวนผลไม้ และชายหาดสวยงาม", provinces: ["จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ตราด", "ปราจีนบุรี", "ระยอง", "สระแก้ว"] },
  "West": { name: "ภาคตะวันตก", color: "#A16207", textColor: "#FFFFFF", description: "ผืนป่าตะวันตก เขื่อนใหญ่ และประวัติศาสตร์สงคราม", provinces: ["กาญจนบุรี", "ตาก", "ประจวบคีรีขันธ์", "เพชรบุรี", "ราชบุรี"] },
  "South": { name: "ภาคใต้", color: "#2563EB", textColor: "#FFFFFF", description: "ด้ามขวานทอง ขนาบด้วยสองฝั่งทะเล", provinces: ["กระบี่", "ชุมพร", "ตรัง", "นครศรีธรรมราช", "นราธิวาส", "ปัตตานี", "พังงา", "พัทลุง", "ภูเก็ต", "ยะลา", "ระนอง", "สงขลา", "สตูล", "สุราษฎร์ธานี"] }
};

const REGION_PROVINCES_EN: Record<string, string[]> = {
  "North": ["Chiang Rai", "Chiang Mai", "Nan", "Phayao", "Phrae", "Mae Hong Son", "Lampang", "Lamphun", "Uttaradit"],
  "Northeast": ["Kalasin", "Khon Kaen", "Chaiyaphum", "Nakhon Phanom", "Nakhon Ratchasima", "Bueng Kan", "Buri Ram", "Maha Sarakham", "Mukdahan", "Yasothon", "Roi Et", "Loei", "Sakon Nakhon", "Surin", "Si Sa Ket", "Nong Khai", "Nong Bua Lam Phu", "Udon Thani", "Ubon Ratchathani", "Amnat Charoen"],
  "Central": ["Bangkok Metropolis", "Bangkok", "Kamphaeng Phet", "Chai Nat", "Nakhon Nayok", "Nakhon Pathom", "Nakhon Sawan", "Nonthaburi", "Pathum Thani", "Phra Nakhon Si Ayutthaya", "Phichit", "Phitsanulok", "Phetchabun", "Lop Buri", "Samut Prakan", "Samut Songkhram", "Samut Sakhon", "Saraburi", "Sing Buri", "Sukhothai", "Suphan Buri", "Ang Thong", "Uthai Thani"],
  "East": ["Chanthaburi", "Chachoengsao", "Chon Buri", "Trat", "Prachin Buri", "Rayong", "Sa Kaeo"],
  "West": ["Kanchanaburi", "Tak", "Prachuap Khiri Khan", "Phetchaburi", "Ratchaburi"],
  "South": ["Krabi", "Chumphon", "Trang", "Nakhon Si Thammarat", "Narathiwat", "Pattani", "Phangnga", "Phatthalung", "Phuket", "Yala", "Ranong", "Songkhla", "Satun", "Surat Thani"]
};

const REGION_LABELS_EN: Record<string, string> = {
  North: "Northern",
  Northeast: "Northeastern",
  Central: "Central",
  East: "Eastern",
  West: "Western",
  South: "Southern"
};

const UI_TEXT = {
  TH: {
    mapTitle: "แผนที่ประเทศไทย",
    mapSubtitle: "คลิกที่จังหวัดเพื่อดูรายอำเภอ",
    backToAmphoe: "กลับไปเลือกอำเภอ",
    backToCountry: "กลับไปหน้าประเทศไทย",
    loadingCountry: "กำลังโหลดแผนที่ประเทศไทย...",
    loadingAmphoe: "กำลังโหลดข้อมูลอำเภอ...",
    loadingTambon: "กำลังโหลดข้อมูลตำบล...",
    loadingFallback: "กำลังโหลด...",
    errorTitle: "เกิดข้อผิดพลาด",
    errorBackHome: "กลับไปหน้าหลัก",
    toggleLabelsHide: "ซ่อนชื่อ",
    toggleLabelsShow: "แสดงชื่อ",
    focusMode: "โหมดโฟกัส",
    shareLink: "แชร์ลิงก์",
    linkCopied: "คัดลอกแล้ว",
    layerRegion: "ภูมิภาค",
    layerArea: "ขนาดพื้นที่",
    searchPlaceholder: "ค้นหาจังหวัด/อำเภอ/ตำบล",
    searchLoading: "กำลังโหลดฐานข้อมูลค้นหา...",
    searchNoResults: "ไม่พบผลลัพธ์",
    typeProvince: "จังหวัด",
    typeAmphoe: "อำเภอ",
    typeTambon: "ตำบล",
    legendTitle: "ภูมิภาค",
    legendSmall: "เล็ก",
    legendLarge: "ใหญ่",
    tourStart: "เริ่มทัวร์ภาค",
    tourStop: "หยุดทัวร์ภาค",
    touringPrefix: "กำลังพาเที่ยว",
    sidebarTitleProvince: "ข้อมูลจังหวัด",
    sidebarTitleAmphoe: "ข้อมูลอำเภอ",
    sidebarTitleTambon: "ข้อมูลตำบล",
    emptyCountryTitle: "เลือกจังหวัดเพื่อดูข้อมูลลึก",
    emptyCountryHint: "คลิกที่จังหวัดใดก็ได้ เช่น \"เชียงราย\" ระบบจะแสดงแผนที่รายอำเภอ",
    breadcrumbCountry: "ประเทศไทย",
    selectedAmphoeTitle: "อำเภอที่เลือก",
    postalCode: "รหัสไปรษณีย์",
    area: "พื้นที่ (km²)",
    areaUnknown: "ไม่มีข้อมูลพื้นที่",
    noAmphoeTitle: "ยังไม่ได้เลือกอำเภอ",
    noAmphoeHint: "คลิกที่อำเภอในแผนที่เพื่อดูตำบล",
    selectedTambonTitle: "ตำบลที่เลือก",
    allPostcodes: "รหัสไปรษณีย์ทั้งหมด",
    postcodesLoading: "กำลังโหลดรหัสไปรษณีย์...",
    postcodesNotFound: "ไม่พบรหัสไปรษณีย์",
    noTambonTitle: "ยังไม่ได้เลือกตำบล",
    noTambonHint: "คลิกที่พื้นที่ในแผนที่เพื่อดูข้อมูลตำบล",
    noTambonHintList: "เลือกตำบลจากรายชื่อด้านล่างเพื่อดูข้อมูล",
    backToOtherProvinces: "กลับไปเลือกจังหวัดอื่น",
    errorAmphoe: "ไม่สามารถโหลดข้อมูลอำเภอได้ (กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต)",
    errorTambon: "ไม่สามารถโหลดข้อมูลตำบลได้ (กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต)",
    errorPostcodes: "ไม่สามารถโหลดรหัสไปรษณีย์ได้",
    tambonMapUnavailableTitle: "ไม่มีแผนที่ตำบลในชุดข้อมูลแผนที่",
    tambonMapUnavailableHint: "แสดงรายชื่อแขวง/ตำบลจากฐานไปรษณีย์ทางแถบข้อมูลแทน",
    tambonFallbackListTitle: "รายชื่อแขวง/ตำบลจากฐานไปรษณีย์",
    tambonFallbackListHint: "คลิกชื่อเพื่อดูรหัสไปรษณีย์ทั้งหมด",
    tambonFallbackEmpty: "ไม่พบรายชื่อแขวง/ตำบลในฐานไปรษณีย์"
  },
  EN: {
    mapTitle: "Thailand Map",
    mapSubtitle: "Click a province to view districts",
    backToAmphoe: "Back to districts",
    backToCountry: "Back to Thailand map",
    loadingCountry: "Loading Thailand map...",
    loadingAmphoe: "Loading district data...",
    loadingTambon: "Loading subdistrict data...",
    loadingFallback: "Loading...",
    errorTitle: "Something went wrong",
    errorBackHome: "Back to home",
    toggleLabelsHide: "Hide labels",
    toggleLabelsShow: "Show labels",
    focusMode: "Focus mode",
    shareLink: "Share link",
    linkCopied: "Copied",
    layerRegion: "Region",
    layerArea: "Area size",
    searchPlaceholder: "Search province/district/subdistrict",
    searchLoading: "Loading search index...",
    searchNoResults: "No results found",
    typeProvince: "Province",
    typeAmphoe: "District",
    typeTambon: "Subdistrict",
    legendTitle: "Regions",
    legendSmall: "Small",
    legendLarge: "Large",
    tourStart: "Start region tour",
    tourStop: "Stop region tour",
    touringPrefix: "Touring",
    sidebarTitleProvince: "Province info",
    sidebarTitleAmphoe: "District info",
    sidebarTitleTambon: "Subdistrict info",
    emptyCountryTitle: "Select a province for details",
    emptyCountryHint: "Click a province (e.g., Chiang Rai) to see districts",
    breadcrumbCountry: "Thailand",
    selectedAmphoeTitle: "Selected district",
    postalCode: "Postal code",
    area: "Area (km²)",
    areaUnknown: "Area data unavailable",
    noAmphoeTitle: "No district selected",
    noAmphoeHint: "Click a district on the map to see subdistricts",
    selectedTambonTitle: "Selected subdistrict",
    allPostcodes: "All postal codes",
    postcodesLoading: "Loading postal codes...",
    postcodesNotFound: "No postal codes found",
    noTambonTitle: "No subdistrict selected",
    noTambonHint: "Click a subdistrict on the map for details",
    noTambonHintList: "Select a subdistrict from the list below for details",
    backToOtherProvinces: "Back to other provinces",
    errorAmphoe: "Unable to load district data (check your connection).",
    errorTambon: "Unable to load subdistrict data (check your connection).",
    errorPostcodes: "Unable to load postal codes.",
    tambonMapUnavailableTitle: "No subdistrict map in this dataset",
    tambonMapUnavailableHint: "Showing subdistrict list from the postal database in the sidebar",
    tambonFallbackListTitle: "Subdistrict list from postal database",
    tambonFallbackListHint: "Click a name to see all postal codes",
    tambonFallbackEmpty: "No subdistricts found in the postal database"
  }
} as const;

const normalizeProvinceName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(จ\.|จังหวัด|จ )/, "")
    .replace(/province$/i, "")
    .replace(/metropolis$/i, "")
    .replace(/[().,ฯ'’\\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeProvinceKey = (name: string): string =>
  normalizeProvinceName(name).replace(/\s+/g, "");

const normalizeAdminName = (name: string): string => {
  if (!name) return "";
  let cleaned = name.toLowerCase();
  const prefixes = ["กิ่งอำเภอ", "อำเภอ", "เขต", "แขวง", "ตำบล", "ต.", "อ.", "k."];
  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length);
      break;
    }
  }
  cleaned = cleaned.replace(/^k\s+/, "");
  cleaned = cleaned.replace(/mueang/g, "muang");
  return cleaned
    .replace(/[().,ฯ'’\\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeAdminKey = (name: string): string =>
  normalizeAdminName(name).replace(/\s+/g, "");

const buildNormalizedSet = (
  values: Array<string | undefined>,
  normalizer: (value: string) => string
): Set<string> => {
  const set = new Set<string>();
  values.forEach((value) => {
    if (!value) return;
    const normalized = normalizer(value);
    if (normalized) set.add(normalized);
  });
  return set;
};

const setsOverlap = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size === 0 || b.size === 0) return false;
  for (const entry of a) {
    if (b.has(entry)) return true;
  }
  return false;
};

const isValidName = (value?: string): value is string =>
  Boolean(value && value !== "NA");

const EARTH_RADIUS_KM = 6371;
const formatAreaKm2 = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const computeFeatureAreaKm2 = (feature?: GeoJSONFeature | null): number | null => {
  if (!feature || typeof window === "undefined" || !window.d3) return null;
  const areaSteradians = window.d3.geoArea(feature);
  if (typeof areaSteradians !== "number") return null;
  return areaSteradians * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
};

const buildTambonKey = (provinceName: string, amphoeName: string, tambonName: string): string => {
  const provinceKey = normalizeProvinceKey(provinceName);
  const amphoeKey = normalizeAdminKey(amphoeName);
  const tambonKey = normalizeAdminKey(tambonName);
  if (!provinceKey || !amphoeKey || !tambonKey) return "";
  return `${provinceKey}|${amphoeKey}|${tambonKey}`;
};

const hasValidTambonName = (properties: GeoJSONProperties): boolean =>
  isValidName(properties.NAME_3) ||
  isValidName(properties.NL_NAME_3) ||
  isValidName(properties.name_th) ||
  isValidName(properties.name);

const pickValidName = (...names: Array<string | undefined>): string => {
  for (const name of names) {
    if (isValidName(name)) return name;
  }
  return "";
};

const getProvinceNameEn = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NAME_1,
    properties.name,
    properties.NL_NAME_1,
    properties.PROV_NAM_T,
    properties.pro_th,
    properties.province_th,
    properties.name_th
  );

const getProvinceNameTh = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NL_NAME_1,
    properties.PROV_NAM_T,
    properties.pro_th,
    properties.province_th,
    properties.name_th
  );

const getAmphoeNameEn = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NAME_2,
    properties.name,
    properties.NL_NAME_2,
    properties.AMP_NAM_T,
    properties.ap_th
  );

const getAmphoeNameTh = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NL_NAME_2,
    properties.AMP_NAM_T,
    properties.ap_th
  );

const getTambonNameEn = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NAME_3,
    properties.name,
    properties.NL_NAME_3,
    properties.name_th
  );

const getTambonNameTh = (properties: GeoJSONProperties): string =>
  pickValidName(
    properties.NL_NAME_3,
    properties.name_th
  );

const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[().,ฯ'’\\-]/g, "")
    .replace(/\s+/g, "");

const matchNormalizedKey = (
  value: string | undefined,
  targetKey: string,
  normalizer: (value: string) => string
): boolean => {
  if (!value) return false;
  if (!targetKey) return false;
  const candidateKey = normalizer(value);
  if (!candidateKey) return false;
  return candidateKey === targetKey || candidateKey.includes(targetKey) || targetKey.includes(candidateKey);
};

const REGION_LOOKUP: Record<string, string> = (() => {
  const lookup: Record<string, string> = {};
  const add = (regionKey: string, names: string[]) => {
    names.forEach((name) => {
      const normalized = normalizeProvinceName(name);
      if (normalized) lookup[normalized] = regionKey;
    });
  };
  Object.entries(REGION_CONFIG).forEach(([key, config]) => add(key, config.provinces));
  Object.entries(REGION_PROVINCES_EN).forEach(([key, names]) => add(key, names));
  return lookup;
})();

const getRegionByProvince = (provinceName: string): string => {
  const normalized = normalizeProvinceName(provinceName);
  return REGION_LOOKUP[normalized] || "Central";
};

// URLs
const URL_PROVINCES = 'https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json';
//const URL_PROVINCES = 'https://raw.githubusercontent.com/thailand-geography/thailand-geography-json/main/src/provinces.json';

const AMPHOE_URL_CANDIDATES = [
  '/api/amphoes'
];

const TAMBON_URL_CANDIDATES = [
  '/api/tambons'
];

const POSTCODE_URL_CANDIDATES = [
  '/api/postcodes'
];

export default function App() {
  // State Types
  const [viewState, setViewState] = useState<'COUNTRY' | 'PROVINCE' | 'AMPHOE'>('COUNTRY');
  const [provinceData, setProvinceData] = useState<GeoJSONData | null>(null);
  const [amphoeData, setAmphoeData] = useState<GeoJSONData | null>(null);
  const [tambonData, setTambonData] = useState<GeoJSONData | null>(null);
  const [postcodeData, setPostcodeData] = useState<PostcodeData | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<SelectedProvince | null>(null);
  const [selectedAmphoe, setSelectedAmphoe] = useState<SelectedAmphoe | null>(null);
  const [selectedTambon, setSelectedTambon] = useState<SelectedTambon | null>(null);
  const [selectedTambonPostcodes, setSelectedTambonPostcodes] = useState<string[]>([]);
  const [selectedAmphoePostcodes, setSelectedAmphoePostcodes] = useState<string[]>([]);
  const [selectedAmphoeAreaKm2, setSelectedAmphoeAreaKm2] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(true);
  const [mapLayer, setMapLayer] = useState<'REGION' | 'AREA'>('REGION');
  const [tourActive, setTourActive] = useState<boolean>(false);
  const [tourRegionKey, setTourRegionKey] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [deepLinkApplied, setDeepLinkApplied] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAmphoe, setLoadingAmphoe] = useState<boolean>(false);
  const [loadingTambon, setLoadingTambon] = useState<boolean>(false);
  const [loadingPostcodes, setLoadingPostcodes] = useState<boolean>(false);
  const [errorAmphoe, setErrorAmphoe] = useState<string | null>(null);
  const [errorTambon, setErrorTambon] = useState<string | null>(null);
  const [errorPostcodes, setErrorPostcodes] = useState<string | null>(null);
  const [d3Loaded, setD3Loaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('TH');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<any>(null);

  const t = UI_TEXT[language];

  // 1. Load D3
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://d3js.org/d3.v7.min.js";
    script.async = true;
    script.onload = () => setD3Loaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // 2. Load Province Data
  useEffect(() => {
    fetch(URL_PROVINCES)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load province data");
        return res.json();
      })
      .then((data: GeoJSONData) => {
        setProvinceData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Err loading provinces:", err);
        setLoading(false);
      });
  }, []);

  // Function to load Amphoe data with types
  const loadAmphoeData = async (): Promise<GeoJSONData | null> => {
    if (amphoeData) return amphoeData;
    setLoadingAmphoe(true);
    setErrorAmphoe(null);

    for (const url of AMPHOE_URL_CANDIDATES) {
      try {
        console.log(`Trying to load amphoes from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: GeoJSONData = await res.json();

        setAmphoeData(data);
        setLoadingAmphoe(false);
        return data;
      } catch (err) {
        console.warn(`Failed to load from ${url}:`, err);
      }
    }

    setErrorAmphoe(UI_TEXT[language].errorAmphoe);
    setLoadingAmphoe(false);
    return null;
  };

  const loadTambonData = async (): Promise<GeoJSONData | null> => {
    if (tambonData) return tambonData;
    setLoadingTambon(true);
    setErrorTambon(null);

    for (const url of TAMBON_URL_CANDIDATES) {
      try {
        console.log(`Trying to load tambons from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: GeoJSONData = await res.json();

        setTambonData(data);
        setLoadingTambon(false);
        return data;
      } catch (err) {
        console.warn(`Failed to load from ${url}:`, err);
      }
    }

    setErrorTambon(UI_TEXT[language].errorTambon);
    setLoadingTambon(false);
    return null;
  };

  const loadPostcodeData = async (): Promise<PostcodeData | null> => {
    if (postcodeData) return postcodeData;
    if (loadingPostcodes) return null;
    setLoadingPostcodes(true);
    setErrorPostcodes(null);

    for (const url of POSTCODE_URL_CANDIDATES) {
      try {
        console.log(`Trying to load postcodes from: ${url}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: PostcodeData = await res.json();

        setPostcodeData(data);
        setLoadingPostcodes(false);
        return data;
      } catch (err) {
        console.warn(`Failed to load from ${url}:`, err);
      }
    }

    setErrorPostcodes(UI_TEXT[language].errorPostcodes);
    setLoadingPostcodes(false);
    return null;
  };

  const provinceNameLookup = useMemo(() => {
    const lookup = new Map<string, { th: string; en: string }>();
    if (!postcodeData) return lookup;
    postcodeData.provinces.forEach((province) => {
      const en = province.provinceNameEn;
      const th = province.provinceNameTh || province.provinceNameEn;
      const enKey = normalizeProvinceKey(en);
      const thKey = normalizeProvinceKey(th);
      if (enKey) lookup.set(enKey, { th, en });
      if (thKey && !lookup.has(thKey)) lookup.set(thKey, { th, en });
    });
    return lookup;
  }, [postcodeData]);

  const tambonNameLookup = useMemo(() => {
    const lookup = new Map<string, { th: string; en: string }>();
    if (!postcodeData) return lookup;
    const provinceByCode = new Map<number, ProvinceEntry>();
    const districtByCode = new Map<number, DistrictEntry>();
    postcodeData.provinces.forEach((province) => provinceByCode.set(province.provinceCode, province));
    postcodeData.districts.forEach((district) => districtByCode.set(district.districtCode, district));
    postcodeData.subdistricts.forEach((subdistrict) => {
      const province = provinceByCode.get(subdistrict.provinceCode);
      const district = districtByCode.get(subdistrict.districtCode);
      if (!province || !district) return;
      const key = buildTambonKey(province.provinceNameEn, district.districtNameEn, subdistrict.subdistrictNameEn);
      if (!key) return;
      const th = subdistrict.subdistrictNameTh || subdistrict.subdistrictNameEn;
      const en = subdistrict.subdistrictNameEn;
      if (!lookup.has(key)) lookup.set(key, { th, en });
    });
    return lookup;
  }, [postcodeData]);

  const formatDualDisplay = (preferred?: string, alternate?: string): string => {
    if (!preferred && !alternate) return "Unknown";
    if (!preferred) return alternate || "Unknown";
    if (!alternate || preferred === alternate) return preferred;
    return `${preferred} · ${alternate}`;
  };

  // Helpers
  const getThaiName = (properties: GeoJSONProperties): string => {
    if (isValidName(properties.NL_NAME_3)) return properties.NL_NAME_3;
    if (isValidName(properties.NAME_3)) return properties.NAME_3;
    if (isValidName(properties.NL_NAME_2)) return properties.NL_NAME_2;
    if (properties.name_th) return properties.name_th;
    if (properties.pro_th) return properties.pro_th;
    if (properties.ap_th) return properties.ap_th;
    if (properties.AMP_NAM_T) return properties.AMP_NAM_T;
    if (properties.PROV_NAM_T) return properties.PROV_NAM_T;
    if (isValidName(properties.NAME_2)) return properties.NAME_2;
    if (isValidName(properties.NL_NAME_1)) return properties.NL_NAME_1;
    if (isValidName(properties.NAME_1)) return properties.NAME_1;
    return properties.name || "Unknown";
  };

  const getProvinceDisplayName = (properties: GeoJSONProperties): string => {
    const nameEn = getProvinceNameEn(properties);
    const nameTh = getProvinceNameTh(properties);
    if (language === 'TH') {
      if (nameTh) return nameTh;
      const mapped = nameEn ? provinceNameLookup.get(normalizeProvinceKey(nameEn)) : undefined;
      return mapped?.th || nameEn || nameTh || "Unknown";
    }
    return nameEn || nameTh || "Unknown";
  };

  const getAmphoeDisplayName = (properties: GeoJSONProperties): string => {
    const nameTh = getAmphoeNameTh(properties);
    const nameEn = getAmphoeNameEn(properties);
    return language === 'TH' ? (nameTh || nameEn || "Unknown") : (nameEn || nameTh || "Unknown");
  };

  const getTambonDisplayName = (
    properties: GeoJSONProperties,
    provinceName?: string,
    amphoeName?: string
  ): string => {
    const nameTh = getTambonNameTh(properties);
    const nameEn = getTambonNameEn(properties);
    const fallbackTh = nameTh || nameEn;
    const fallbackEn = nameEn || nameTh;
    let mappedTh: string | undefined;
    let mappedEn: string | undefined;
    if (provinceName && amphoeName && nameEn) {
      const key = buildTambonKey(provinceName, amphoeName, nameEn);
      const mapped = key ? tambonNameLookup.get(key) : undefined;
      mappedTh = mapped?.th;
      mappedEn = mapped?.en;
    }
    const finalTh = mappedTh || fallbackTh;
    const finalEn = mappedEn || fallbackEn;
    return language === 'TH'
      ? formatDualDisplay(finalTh, finalEn)
      : formatDualDisplay(finalEn, finalTh);
  };

  const getRegionLabel = (regionKey: string): string => {
    if (language === 'TH') {
      return REGION_CONFIG[regionKey]?.name || regionKey;
    }
    return REGION_LABELS_EN[regionKey] || REGION_CONFIG[regionKey]?.name || regionKey;
  };

  const getProvinceNameFromFeature = (properties: GeoJSONProperties): string => {
    if (isValidName(properties.NAME_1)) return properties.NAME_1;
    if (isValidName(properties.NL_NAME_1)) return properties.NL_NAME_1;
    if (properties.province_th) return properties.province_th;
    if (properties.pro_th) return properties.pro_th;
    if (properties.PROV_NAM_T) return properties.PROV_NAM_T;
    return "";
  };

  const getAmphoeNameFromTambon = (properties: GeoJSONProperties): string => {
    if (isValidName(properties.NL_NAME_2)) return properties.NL_NAME_2;
    if (isValidName(properties.NAME_2)) return properties.NAME_2;
    if (properties.ap_th) return properties.ap_th;
    if (properties.AMP_NAM_T) return properties.AMP_NAM_T;
    return "";
  };

  const tambonMapAvailable = useMemo(() => {
    if (viewState !== 'AMPHOE') return true;
    if (!tambonData || !selectedProvince || !selectedAmphoe) return true;
    const targetProvinceKey = normalizeProvinceKey(selectedProvince.name);
    const targetAmphoeKey = normalizeAdminKey(selectedAmphoe.name);
    const matchedFeatures = tambonData.features.filter((feature) => {
      const provinceName = getProvinceNameFromFeature(feature.properties);
      const amphoeName = getAmphoeNameFromTambon(feature.properties);
      const provinceKey = normalizeProvinceKey(provinceName);
      const amphoeKey = normalizeAdminKey(amphoeName);
      const provinceMatch =
        provinceKey === targetProvinceKey ||
        provinceKey.includes(targetProvinceKey) ||
        targetProvinceKey.includes(provinceKey);
      const amphoeMatch =
        amphoeKey === targetAmphoeKey ||
        amphoeKey.includes(targetAmphoeKey) ||
        targetAmphoeKey.includes(amphoeKey);
      return provinceMatch && amphoeMatch;
    });
    if (matchedFeatures.length === 0) return false;
    return matchedFeatures.some((feature) => hasValidTambonName(feature.properties));
  }, [viewState, tambonData, selectedProvince, selectedAmphoe]);

  useEffect(() => {
    if (viewState !== 'AMPHOE' || tambonMapAvailable) return;
    if (!postcodeData && !loadingPostcodes) {
      void loadPostcodeData();
    }
  }, [viewState, tambonMapAvailable, postcodeData, loadingPostcodes]);

  const tambonFallbackList = useMemo(() => {
    if (!postcodeData || !selectedProvince || !selectedAmphoe) return [];
    const provinceKey = normalizeProvinceKey(selectedProvince.name);
    const amphoeKey = normalizeAdminKey(selectedAmphoe.name);

    const provinceMatches = postcodeData.provinces.filter((province) =>
      matchNormalizedKey(province.provinceNameEn, provinceKey, normalizeProvinceKey) ||
      matchNormalizedKey(province.provinceNameTh, provinceKey, normalizeProvinceKey)
    );
    const provinceCodes = provinceMatches.map((province) => province.provinceCode);

    const districtMatches = postcodeData.districts.filter((district) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(district.provinceCode)) {
        return false;
      }
      return (
        matchNormalizedKey(district.districtNameEn, amphoeKey, normalizeAdminKey) ||
        matchNormalizedKey(district.districtNameTh, amphoeKey, normalizeAdminKey)
      );
    });
    const districtCodes = districtMatches.map((district) => district.districtCode);

    const grouped = new Map<string, { nameTh: string; nameEn: string; codes: Set<string> }>();
    postcodeData.subdistricts.forEach((subdistrict) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(subdistrict.provinceCode)) {
        return;
      }
      if (districtCodes.length > 0 && !districtCodes.includes(subdistrict.districtCode)) {
        return;
      }
      const nameEn = subdistrict.subdistrictNameEn || "";
      const nameTh = subdistrict.subdistrictNameTh || nameEn;
      const keyBase = nameEn || nameTh;
      const key = normalizeAdminKey(keyBase);
      if (!key) return;
      const existing = grouped.get(key) || { nameTh, nameEn, codes: new Set<string>() };
      if (subdistrict.postalCode) {
        existing.codes.add(subdistrict.postalCode.toString());
      }
      grouped.set(key, existing);
    });

    const list: TambonListItem[] = Array.from(grouped.values()).map((entry) => ({
      nameTh: entry.nameTh,
      nameEn: entry.nameEn,
      postalCodes: Array.from(entry.codes).sort()
    }));

    const locale = language === 'TH' ? 'th' : 'en';
    list.sort((a, b) => {
      const aLabel = language === 'TH' ? a.nameTh : a.nameEn;
      const bLabel = language === 'TH' ? b.nameTh : b.nameEn;
      return aLabel.localeCompare(bLabel, locale, { sensitivity: 'base' });
    });

    return list;
  }, [postcodeData, selectedProvince, selectedAmphoe, language]);

  const stopTour = () => {
    setTourActive(false);
    setTourRegionKey(null);
  };

  const findProvinceFeature = (provinceName: string): GeoJSONFeature | null => {
    if (!provinceData) return null;
    const targetKey = normalizeProvinceKey(provinceName);
    return (
      provinceData.features.find((feature) =>
        matchNormalizedKey(getThaiName(feature.properties), targetKey, normalizeProvinceKey)
      ) || null
    );
  };

  const findAmphoeFeature = (
    provinceName: string,
    amphoeName: string,
    data: GeoJSONData
  ): GeoJSONFeature | null => {
    const provinceKey = normalizeProvinceKey(provinceName);
    const amphoeKey = normalizeAdminKey(amphoeName);
    return (
      data.features.find(
        (feature) =>
          matchNormalizedKey(getProvinceNameFromFeature(feature.properties), provinceKey, normalizeProvinceKey) &&
          (
            matchNormalizedKey(feature.properties.NAME_2, amphoeKey, normalizeAdminKey) ||
            matchNormalizedKey(feature.properties.NL_NAME_2, amphoeKey, normalizeAdminKey) ||
            matchNormalizedKey(getThaiName(feature.properties), amphoeKey, normalizeAdminKey)
          )
      ) || null
    );
  };

  const findTambonFeature = (
    provinceName: string,
    amphoeName: string,
    tambonName: string,
    data: GeoJSONData
  ): GeoJSONFeature | null => {
    const provinceKey = normalizeProvinceKey(provinceName);
    const amphoeKey = normalizeAdminKey(amphoeName);
    const tambonKey = normalizeAdminKey(tambonName);
    return (
      data.features.find(
        (feature) =>
          matchNormalizedKey(getProvinceNameFromFeature(feature.properties), provinceKey, normalizeProvinceKey) &&
          (
            matchNormalizedKey(feature.properties.NAME_2, amphoeKey, normalizeAdminKey) ||
            matchNormalizedKey(feature.properties.NL_NAME_2, amphoeKey, normalizeAdminKey) ||
            matchNormalizedKey(getAmphoeNameFromTambon(feature.properties), amphoeKey, normalizeAdminKey)
          ) &&
          (
            matchNormalizedKey(feature.properties.NAME_3, tambonKey, normalizeAdminKey) ||
            matchNormalizedKey(feature.properties.NL_NAME_3, tambonKey, normalizeAdminKey) ||
            matchNormalizedKey(getThaiName(feature.properties), tambonKey, normalizeAdminKey)
          )
      ) || null
    );
  };

  const selectProvinceByName = async (provinceName: string) => {
    stopTour();
    const provinceFeature = findProvinceFeature(provinceName);
    if (!provinceFeature) return;
    const name = getThaiName(provinceFeature.properties);
    const region = getRegionByProvince(name);

    setSelectedProvince({ name, region, properties: provinceFeature.properties });
    setSelectedAmphoe(null);
    setSelectedAmphoeAreaKm2(null);
    setSelectedTambon(null);
    setSelectedTambonPostcodes([]);
    setViewState('PROVINCE');
    await loadAmphoeData();
  };

  const selectAmphoeByName = async (provinceName: string, amphoeName: string) => {
    stopTour();
    const provinceFeature = findProvinceFeature(provinceName);
    if (!provinceFeature) return;
    const provinceDisplayName = getThaiName(provinceFeature.properties);
    const region = getRegionByProvince(provinceDisplayName);

    setSelectedProvince({ name: provinceDisplayName, region, properties: provinceFeature.properties });
    setSelectedTambon(null);
    setSelectedTambonPostcodes([]);

    const amphoes = await loadAmphoeData();
    if (!amphoes) return;

    const amphoeFeature = findAmphoeFeature(provinceDisplayName, amphoeName, amphoes);
    if (!amphoeFeature) {
      setSelectedAmphoe(null);
      setSelectedAmphoeAreaKm2(null);
      setViewState('PROVINCE');
      return;
    }

    setSelectedAmphoe({ name: getThaiName(amphoeFeature.properties), properties: amphoeFeature.properties });
    setSelectedAmphoeAreaKm2(computeFeatureAreaKm2(amphoeFeature));
    setSelectedAmphoePostcodes([]);
    setErrorPostcodes(null);
    setViewState('AMPHOE');
    await loadTambonData();
    void loadPostcodeData();
  };

  const selectTambonByName = async (provinceName: string, amphoeName: string, tambonName: string) => {
    stopTour();
    const provinceFeature = findProvinceFeature(provinceName);
    if (!provinceFeature) return;
    const provinceDisplayName = getThaiName(provinceFeature.properties);
    const region = getRegionByProvince(provinceDisplayName);

    setSelectedProvince({ name: provinceDisplayName, region, properties: provinceFeature.properties });
    setSelectedTambonPostcodes([]);

    const amphoes = await loadAmphoeData();
    if (!amphoes) return;

    const amphoeFeature = findAmphoeFeature(provinceDisplayName, amphoeName, amphoes);
    if (!amphoeFeature) {
      setSelectedAmphoe(null);
      setSelectedAmphoeAreaKm2(null);
      setSelectedTambon(null);
      setViewState('PROVINCE');
      return;
    }

    setSelectedAmphoe({ name: getThaiName(amphoeFeature.properties), properties: amphoeFeature.properties });
    setViewState('AMPHOE');

    const tambons = await loadTambonData();
    if (!tambons) return;

    const tambonFeature = findTambonFeature(provinceDisplayName, amphoeName, tambonName, tambons);
    setSelectedTambon(tambonFeature ? { name: getThaiName(tambonFeature.properties), properties: tambonFeature.properties } : null);
    void loadPostcodeData();
  };

  useEffect(() => {
    if (!selectedTambon || !selectedAmphoe || !selectedProvince) {
      setSelectedTambonPostcodes([]);
      return;
    }

    if (!postcodeData) {
      setSelectedTambonPostcodes([]);
      void loadPostcodeData();
      return;
    }

    const provinceKey = normalizeProvinceKey(selectedProvince.name);
    const amphoeKey = normalizeAdminKey(selectedAmphoe.name);
    const tambonKey = normalizeAdminKey(selectedTambon.name);

    const provinceMatches = postcodeData.provinces.filter((province) =>
      matchNormalizedKey(province.provinceNameEn, provinceKey, normalizeProvinceKey) ||
      matchNormalizedKey(province.provinceNameTh, provinceKey, normalizeProvinceKey)
    );
    const provinceCodes = provinceMatches.map((province) => province.provinceCode);

    const districtMatches = postcodeData.districts.filter((district) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(district.provinceCode)) {
        return false;
      }
      return (
        matchNormalizedKey(district.districtNameEn, amphoeKey, normalizeAdminKey) ||
        matchNormalizedKey(district.districtNameTh, amphoeKey, normalizeAdminKey)
      );
    });
    const districtCodes = districtMatches.map((district) => district.districtCode);

    const tambonMatches = postcodeData.subdistricts.filter((subdistrict) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(subdistrict.provinceCode)) {
        return false;
      }
      if (districtCodes.length > 0 && !districtCodes.includes(subdistrict.districtCode)) {
        return false;
      }
      return (
        matchNormalizedKey(subdistrict.subdistrictNameEn, tambonKey, normalizeAdminKey) ||
        matchNormalizedKey(subdistrict.subdistrictNameTh, tambonKey, normalizeAdminKey)
      );
    });

    const codes = Array.from(
      new Set(
        tambonMatches
          .map((subdistrict) => subdistrict.postalCode)
          .filter((code): code is number => typeof code === "number")
      )
    )
      .sort((a, b) => a - b)
      .map((code) => code.toString());

    setSelectedTambonPostcodes(codes);
  }, [selectedTambon, selectedAmphoe, selectedProvince, postcodeData]);

  useEffect(() => {
    if (!selectedAmphoe || !selectedProvince) {
      setSelectedAmphoePostcodes([]);
      return;
    }

    if (!postcodeData) {
      setSelectedAmphoePostcodes([]);
      void loadPostcodeData();
      return;
    }

    const provinceKey = normalizeProvinceKey(selectedProvince.name);
    const amphoeKey = normalizeAdminKey(selectedAmphoe.name);

    const provinceMatches = postcodeData.provinces.filter((province) =>
      matchNormalizedKey(province.provinceNameEn, provinceKey, normalizeProvinceKey) ||
      matchNormalizedKey(province.provinceNameTh, provinceKey, normalizeProvinceKey)
    );
    const provinceCodes = provinceMatches.map((province) => province.provinceCode);

    const districtMatches = postcodeData.districts.filter((district) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(district.provinceCode)) {
        return false;
      }
      return (
        matchNormalizedKey(district.districtNameEn, amphoeKey, normalizeAdminKey) ||
        matchNormalizedKey(district.districtNameTh, amphoeKey, normalizeAdminKey)
      );
    });
    const districtCodes = districtMatches.map((district) => district.districtCode);

    const codes = new Set<number>();
    postcodeData.subdistricts.forEach((subdistrict) => {
      if (provinceCodes.length > 0 && !provinceCodes.includes(subdistrict.provinceCode)) {
        return;
      }
      if (districtCodes.length > 0 && !districtCodes.includes(subdistrict.districtCode)) {
        return;
      }
      if (typeof subdistrict.postalCode === "number") {
        codes.add(subdistrict.postalCode);
      }
    });

    if (codes.size === 0) {
      districtMatches.forEach((district) => {
        if (typeof district.postalCode === "number") {
          codes.add(district.postalCode);
        }
      });
    }

    const sorted = Array.from(codes)
      .sort((a, b) => a - b)
      .map((code) => code.toString());

    setSelectedAmphoePostcodes(sorted);
  }, [selectedAmphoe, selectedProvince, postcodeData]);

  useEffect(() => {
    if (!searchTerm.trim()) return;
    if (!postcodeData && !loadingPostcodes) {
      void loadPostcodeData();
    }
  }, [searchTerm, postcodeData, loadingPostcodes]);

  useEffect(() => {
    if (language !== 'TH') return;
    if (!postcodeData && !loadingPostcodes) {
      void loadPostcodeData();
    }
  }, [language, postcodeData, loadingPostcodes]);

  const searchIndex = useMemo(() => {
    const items: SearchIndexItem[] = [];

    if (postcodeData) {
      const provinceByCode = new Map<number, ProvinceEntry>();
      const districtByCode = new Map<number, DistrictEntry>();

      postcodeData.provinces.forEach((province) => {
        provinceByCode.set(province.provinceCode, province);
        const labelTh = province.provinceNameTh || province.provinceNameEn;
        const labelEn = province.provinceNameEn;
        const searchKey = normalizeSearchText(`${province.provinceNameTh} ${province.provinceNameEn}`);
        if (!searchKey) return;
        items.push({
          id: `province-${province.provinceCode}`,
          type: 'province',
          labelTh,
          labelEn,
          provinceName: province.provinceNameEn,
          searchKey
        });
      });

      postcodeData.districts.forEach((district) => {
        districtByCode.set(district.districtCode, district);
        const province = provinceByCode.get(district.provinceCode);
        if (!province) return;
        const labelTh = district.districtNameTh || district.districtNameEn;
        const labelEn = district.districtNameEn;
        const sublabelTh = province.provinceNameTh || province.provinceNameEn;
        const sublabelEn = province.provinceNameEn;
        const searchKey = normalizeSearchText(
          `${district.districtNameTh} ${district.districtNameEn} ${province.provinceNameTh} ${province.provinceNameEn}`
        );
        if (!searchKey) return;
        items.push({
          id: `amphoe-${district.districtCode}`,
          type: 'amphoe',
          labelTh,
          labelEn,
          sublabelTh,
          sublabelEn,
          provinceName: province.provinceNameEn,
          amphoeName: district.districtNameEn,
          searchKey
        });
      });

      postcodeData.subdistricts.forEach((subdistrict) => {
        const province = provinceByCode.get(subdistrict.provinceCode);
        const district = districtByCode.get(subdistrict.districtCode);
        if (!province || !district) return;
        const labelTh = subdistrict.subdistrictNameTh || subdistrict.subdistrictNameEn;
        const labelEn = subdistrict.subdistrictNameEn;
        const sublabelTh = `${district.districtNameTh || district.districtNameEn} • ${province.provinceNameTh || province.provinceNameEn}`;
        const sublabelEn = `${district.districtNameEn} • ${province.provinceNameEn}`;
        const searchKey = normalizeSearchText(
          `${subdistrict.subdistrictNameTh} ${subdistrict.subdistrictNameEn} ${district.districtNameTh} ${district.districtNameEn} ${province.provinceNameTh} ${province.provinceNameEn}`
        );
        if (!searchKey) return;
        items.push({
          id: `tambon-${subdistrict.subdistrictCode}`,
          type: 'tambon',
          labelTh,
          labelEn,
          sublabelTh,
          sublabelEn,
          provinceName: province.provinceNameEn,
          amphoeName: district.districtNameEn,
          tambonName: subdistrict.subdistrictNameEn,
          searchKey
        });
      });
    } else if (provinceData) {
      provinceData.features.forEach((feature, index) => {
        const labelEn = getProvinceNameEn(feature.properties) || getThaiName(feature.properties);
        const labelTh =
          getProvinceNameTh(feature.properties) ||
          (labelEn ? provinceNameLookup.get(normalizeProvinceKey(labelEn))?.th : undefined) ||
          labelEn;
        const provinceName = labelEn || labelTh;
        const searchKey = normalizeSearchText(`${labelTh} ${labelEn}`);
        if (!searchKey) return;
        items.push({
          id: `province-geo-${index}`,
          type: 'province',
          labelTh,
          labelEn,
          provinceName,
          searchKey
        });
      });
    }

    return items;
  }, [postcodeData, provinceData, provinceNameLookup]);

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchTerm.trim());
    if (!query) return [];
    const scored = searchIndex
      .map((item) => {
        const matchIndex = item.searchKey.indexOf(query);
        if (matchIndex === -1) return null;
        const typeBoost = item.type === 'province' ? 0 : item.type === 'amphoe' ? 10 : 20;
        return { item, score: matchIndex + typeBoost };
      })
      .filter((entry): entry is { item: SearchIndexItem; score: number } => Boolean(entry))
      .sort((a, b) => a.score - b.score || a.item.labelEn.length - b.item.labelEn.length)
      .slice(0, 12)
      .map(({ item }) => {
        const label =
          language === 'TH'
            ? item.labelTh || item.labelEn
            : item.labelEn || item.labelTh;
        const sublabel =
          language === 'TH'
            ? item.sublabelTh || item.sublabelEn
            : item.sublabelEn || item.sublabelTh;
        return {
          id: item.id,
          type: item.type,
          label,
          sublabel,
          provinceName: item.provinceName,
          amphoeName: item.amphoeName,
          tambonName: item.tambonName
        };
      });

    return scored;
  }, [searchIndex, searchTerm, language]);

  useEffect(() => {
    if (deepLinkApplied || !provinceData) return;

    const params = new URLSearchParams(window.location.search);
    if (params.toString().length === 0) {
      setDeepLinkApplied(true);
      return;
    }

    const langParam = params.get("lang");
    if (langParam === "en") setLanguage("EN");
    if (langParam === "th") setLanguage("TH");

    const layerParam = params.get("layer");
    if (layerParam === "area") setMapLayer("AREA");
    if (layerParam === "region") setMapLayer("REGION");
    const focusParam = params.get("focus");
    if (focusParam === "0") setFocusMode(false);
    if (focusParam === "1") setFocusMode(true);
    const labelsParam = params.get("labels");
    if (labelsParam === "0") setShowLabels(false);
    if (labelsParam === "1") setShowLabels(true);

    const provinceParam = params.get("p");
    if (!provinceParam) {
      setDeepLinkApplied(true);
      return;
    }

    const provinceFeature = findProvinceFeature(provinceParam);
    if (!provinceFeature) {
      setDeepLinkApplied(true);
      return;
    }

    const provinceName = getThaiName(provinceFeature.properties);
    const region = getRegionByProvince(provinceName);
    setSelectedProvince({ name: provinceName, region, properties: provinceFeature.properties });
    setSelectedTambon(null);
    setSelectedTambonPostcodes([]);

    const amphoeParam = params.get("a");
    if (!amphoeParam) {
      setSelectedAmphoe(null);
      setSelectedAmphoeAreaKm2(null);
      setViewState('PROVINCE');
      void loadAmphoeData();
      setDeepLinkApplied(true);
      return;
    }

    if (!amphoeData) {
      void loadAmphoeData();
      return;
    }

    const amphoeFeature = findAmphoeFeature(provinceName, amphoeParam, amphoeData);
    if (!amphoeFeature) {
      setSelectedAmphoe(null);
      setSelectedAmphoeAreaKm2(null);
      setViewState('PROVINCE');
      setDeepLinkApplied(true);
      return;
    }

    setSelectedAmphoe({ name: getThaiName(amphoeFeature.properties), properties: amphoeFeature.properties });
    setViewState('AMPHOE');
    void loadTambonData();

    const tambonParam = params.get("t");
    if (!tambonParam) {
      setSelectedTambon(null);
      setDeepLinkApplied(true);
      return;
    }

    if (!tambonData) {
      return;
    }

    const tambonFeature = findTambonFeature(provinceName, amphoeParam, tambonParam, tambonData);
    setSelectedTambon(tambonFeature ? { name: getThaiName(tambonFeature.properties), properties: tambonFeature.properties } : null);
    void loadPostcodeData();
    setDeepLinkApplied(true);
  }, [deepLinkApplied, provinceData, amphoeData, tambonData]);

  useEffect(() => {
    if (!deepLinkApplied) return;
    const params = new URLSearchParams();
    if (selectedProvince) params.set("p", selectedProvince.name);
    if (viewState === 'AMPHOE' && selectedAmphoe) params.set("a", selectedAmphoe.name);
    if (viewState === 'AMPHOE' && selectedTambon) params.set("t", selectedTambon.name);
    params.set("layer", mapLayer === 'AREA' ? "area" : "region");
    params.set("labels", showLabels ? "1" : "0");
    params.set("focus", focusMode ? "1" : "0");
    if (language === 'EN') params.set("lang", "en");

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [deepLinkApplied, selectedProvince, selectedAmphoe, selectedTambon, viewState, mapLayer, showLabels, focusMode, language]);

  // 3. Main D3 Render Logic
  useEffect(() => {
    if (!d3Loaded || !svgRef.current) return;

    if (viewState === 'COUNTRY' && !provinceData) return;
    if (viewState === 'PROVINCE' && !selectedProvince) return;
    if (viewState === 'AMPHOE' && (!selectedProvince || !selectedAmphoe)) return;

    const d3 = window.d3;
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 1200;

    svg.selectAll("*").remove();
    svg.on(".zoom", null); // Clear previous zoom listeners

    let projection: any;
    let featuresToRender: GeoJSONFeature[] = [];
    let getFillColor: (d: GeoJSONFeature, i: number) => string;
    let getDisplayName: (d: GeoJSONFeature) => string;
    let getSelectionName: (d: GeoJSONFeature) => string;
    const baseFillMap = new Map<GeoJSONFeature, string>();

    if (viewState === 'COUNTRY') {
      if (provinceData) featuresToRender = provinceData.features;

      // Use fitExtent to maximize map size within the viewbox
      projection = d3.geoMercator().fitExtent(
        [[20, 20], [width - 20, height - 20]],
        provinceData
      );

      getFillColor = (d: GeoJSONFeature) => {
        const pName = getThaiName(d.properties);
        return REGION_CONFIG[getRegionByProvince(pName)].color;
      };
      getDisplayName = (d: GeoJSONFeature) => getProvinceDisplayName(d.properties);
      getSelectionName = (d: GeoJSONFeature) => getThaiName(d.properties);

    } else if (viewState === 'PROVINCE') {
      if (!amphoeData || !selectedProvince) return;

      const provinceKeys = buildNormalizedSet(
        [
          selectedProvince.name,
          getProvinceNameEn(selectedProvince.properties),
          getProvinceNameTh(selectedProvince.properties)
        ],
        normalizeProvinceKey
      );
      featuresToRender = amphoeData.features.filter((f) => {
        const featureKeys = buildNormalizedSet(
          [
            getProvinceNameFromFeature(f.properties),
            getProvinceNameEn(f.properties),
            getProvinceNameTh(f.properties)
          ],
          normalizeProvinceKey
        );
        return setsOverlap(provinceKeys, featureKeys);
      });

      if (featuresToRender.length === 0) {
        console.warn("No amphoes found for", selectedProvince.name);
      }

      if (featuresToRender.length > 0) {
        projection = d3.geoMercator().fitExtent(
          [[20, 20], [width - 20, height - 20]],
          { type: "FeatureCollection", features: featuresToRender }
        );
      } else {
        projection = d3.geoMercator().center([100.5, 13.5]).scale(2500).translate([width / 2, height / 2]);
      }

      const regionColor = REGION_CONFIG[selectedProvince.region].color;
      const colorScale = d3.scaleLinear()
        .domain([0, featuresToRender.length])
        .range([d3.rgb(regionColor).brighter(0.8), d3.rgb(regionColor).darker(0.3)]);

      getFillColor = (d: GeoJSONFeature, i: number) => colorScale(i);
      getDisplayName = (d: GeoJSONFeature) => getAmphoeDisplayName(d.properties);
      getSelectionName = (d: GeoJSONFeature) => getThaiName(d.properties);
    } else if (viewState === 'AMPHOE') {
      if (!tambonData || !selectedProvince || !selectedAmphoe) return;

      const provinceKeys = buildNormalizedSet(
        [
          selectedProvince.name,
          getProvinceNameEn(selectedProvince.properties),
          getProvinceNameTh(selectedProvince.properties)
        ],
        normalizeProvinceKey
      );
      const amphoeKeys = buildNormalizedSet(
        [
          selectedAmphoe.name,
          getAmphoeNameTh(selectedAmphoe.properties),
          getAmphoeNameEn(selectedAmphoe.properties)
        ],
        normalizeAdminKey
      );
      featuresToRender = tambonData.features.filter((f) => {
        const provinceName = getProvinceNameFromFeature(f.properties);
        const amphoeName = getAmphoeNameFromTambon(f.properties);
        const provinceKeySet = buildNormalizedSet(
          [
            provinceName,
            getProvinceNameEn(f.properties),
            getProvinceNameTh(f.properties)
          ],
          normalizeProvinceKey
        );
        const amphoeKeySet = buildNormalizedSet(
          [
            amphoeName,
            getAmphoeNameTh(f.properties),
            getAmphoeNameEn(f.properties)
          ],
          normalizeAdminKey
        );
        return setsOverlap(provinceKeys, provinceKeySet) && setsOverlap(amphoeKeys, amphoeKeySet);
      });

      if (featuresToRender.length === 0) {
        console.warn("No tambons found for", selectedAmphoe.name);
      }

      if (featuresToRender.length > 0) {
        projection = d3.geoMercator().fitExtent(
          [[20, 20], [width - 20, height - 20]],
          { type: "FeatureCollection", features: featuresToRender }
        );
      } else {
        projection = d3.geoMercator().center([100.5, 13.5]).scale(2500).translate([width / 2, height / 2]);
      }

      const regionColor = REGION_CONFIG[selectedProvince.region].color;
      const colorScale = d3.scaleLinear()
        .domain([0, featuresToRender.length])
        .range([d3.rgb(regionColor).brighter(0.9), d3.rgb(regionColor).darker(0.2)]);

      getFillColor = (d: GeoJSONFeature, i: number) => colorScale(i);
      getDisplayName = (d: GeoJSONFeature) =>
        getTambonDisplayName(
          d.properties,
          getProvinceNameEn(d.properties),
          getAmphoeNameEn(d.properties)
        );
      getSelectionName = (d: GeoJSONFeature) => getThaiName(d.properties);
    }

    const pathGenerator = d3.geoPath().projection(projection);
    if (mapLayer === 'AREA' && featuresToRender.length > 0) {
      const areas = featuresToRender.map((feature) => pathGenerator.area(feature));
      const [minArea, maxArea] = d3.extent(areas);
      if (minArea !== undefined && maxArea !== undefined) {
        const safeMax = minArea === maxArea ? minArea + 1 : maxArea;
        const areaScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([minArea, safeMax]);
        getFillColor = (d: GeoJSONFeature) => areaScale(pathGenerator.area(d));
      }
    }
    const g = svg.append("g");
    const gPaths = g.append("g").attr("class", "map-paths");
    const gLabels = g.append("g").attr("class", "map-labels");
    const bringLabelsToFront = () => {
      gLabels.raise();
    };
    const getBaseFill = (d: GeoJSONFeature, i: number) => {
      const color = getFillColor(d, i);
      baseFillMap.set(d, color);
      return color;
    };
    const applyBaseOpacity = () => {
      if (viewState === 'COUNTRY' && tourActive && tourRegionKey) {
        gPaths.selectAll("path").attr("opacity", (d: GeoJSONFeature) => {
          const regionKey = getRegionByProvince(getThaiName(d.properties));
          return regionKey === tourRegionKey ? 1 : 0.15;
        });
        return;
      }
      gPaths.selectAll("path").attr("opacity", 1);
    };

    // Setup Zoom Behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8]) // Zoom limit 1x to 8x
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    if (featuresToRender.length > 0) {
      gPaths.selectAll("path")
        .data(featuresToRender)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("fill", (d: GeoJSONFeature, i: number) => getBaseFill(d, i))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", viewState === 'COUNTRY' ? 0.5 : 1.2)
        .attr("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .on("mouseover", function (this: any, event: any, d: GeoJSONFeature) {
          const name = getDisplayName(d);
          setHoveredFeature(name);
          setHoveredPosition({ x: event.clientX, y: event.clientY });
          d3.select(this)
            .attr("fill", "#FACC15")
            .attr("stroke-width", 2)
            .raise();
          bringLabelsToFront();
          if (focusMode && !tourActive) {
            gPaths.selectAll("path").attr("opacity", 0.3);
            d3.select(this).attr("opacity", 1);
          }
        })
        .on("mousemove", function (this: any, event: any) {
          setHoveredPosition({ x: event.clientX, y: event.clientY });
        })
        .on("mouseout", function (this: any, event: any, d: GeoJSONFeature, i: number) {
          setHoveredFeature(null);
          setHoveredPosition(null);
          const baseFill =
            baseFillMap.get(d) ?? getFillColor(d, featuresToRender.indexOf(d));
          if (viewState === 'AMPHOE') {
            const isSelected = d3.select(this).classed("is-selected");
            d3.select(this).attr("fill", isSelected ? "#DC2626" : baseFill);
          } else {
            d3.select(this).attr("fill", baseFill);
          }
          if (focusMode && !tourActive) {
            applyBaseOpacity();
          }
        })
        .on("click", async function (this: any, event: any, d: GeoJSONFeature) {
          const name = getSelectionName(d);
          stopTour();

          if (viewState === 'COUNTRY') {
            const region = getRegionByProvince(name);
            const provData: SelectedProvince = { name, region, properties: d.properties };

            setSelectedProvince(provData);
            await loadAmphoeData();

            setViewState('PROVINCE');
            setSelectedAmphoe(null);
            setSelectedAmphoeAreaKm2(null);
            setSelectedTambon(null);
            setSelectedTambonPostcodes([]);
            setErrorPostcodes(null);

          } else if (viewState === 'PROVINCE') {
            setSelectedAmphoe({
              name: name,
              properties: d.properties
            });
            setSelectedAmphoeAreaKm2(computeFeatureAreaKm2(d));
            setSelectedTambon(null);
            setSelectedTambonPostcodes([]);
            setSelectedAmphoePostcodes([]);
            setErrorPostcodes(null);

            await loadTambonData();
            setViewState('AMPHOE');
            void loadPostcodeData();
          } else {
            setSelectedTambon({
              name: name,
              properties: d.properties
            });

            void loadPostcodeData();
            gPaths.selectAll("path")
              .classed("is-selected", false)
              .attr("fill", (feat: GeoJSONFeature, idx: number) => getBaseFill(feat, idx));
            d3.select(this).classed("is-selected", true).attr("fill", "#DC2626").raise();
          }
        });

      if (showLabels) {
        gLabels.selectAll("text")
          .data(featuresToRender)
          .enter()
          .append("text")
          .attr("transform", function (d: GeoJSONFeature) {
            const centroid = pathGenerator.centroid(d);
            if (isNaN(centroid[0])) return "translate(-100,-100)";
            return "translate(" + centroid[0] + "," + centroid[1] + ")";
          })
          .attr("dy", ".35em")
          .text((d: GeoJSONFeature) => getDisplayName(d))
          .attr("text-anchor", "middle")
          .attr("font-size", viewState === 'PROVINCE' ? "10px" : "8px")
          .attr("font-weight", viewState === 'COUNTRY' ? "bold" : "normal")
          .attr("fill", "#1F2937")
          .attr("pointer-events", "none")
          .style("text-shadow", "2px 0 #fff, -2px 0 #fff, 0 2px #fff, 0 -2px #fff")
          .style("opacity", 0.9);
      }
      bringLabelsToFront();

      if (viewState === 'AMPHOE' && selectedTambon) {
        const targetKey = normalizeAdminKey(selectedTambon.name);
        gPaths.selectAll("path")
          .classed("is-selected", (feature: GeoJSONFeature) =>
            matchNormalizedKey(getThaiName(feature.properties), targetKey, normalizeAdminKey)
          )
          .attr("fill", (feature: GeoJSONFeature, index: number) => {
            const isSelected = matchNormalizedKey(getThaiName(feature.properties), targetKey, normalizeAdminKey);
            if (isSelected) return "#DC2626";
            return baseFillMap.get(feature) ?? getFillColor(feature, index);
          });
        gPaths.selectAll("path")
          .filter((feature: GeoJSONFeature) =>
            matchNormalizedKey(getThaiName(feature.properties), targetKey, normalizeAdminKey)
          )
          .raise();
      }

      applyBaseOpacity();
    }

  }, [d3Loaded, provinceData, amphoeData, tambonData, viewState, selectedProvince, selectedAmphoe, selectedTambon, showLabels, mapLayer, focusMode, tourActive, tourRegionKey, language, provinceNameLookup, tambonNameLookup]);

  const handleBackToCountry = () => {
    stopTour();
    setViewState('COUNTRY');
    setSelectedAmphoe(null);
    setSelectedAmphoeAreaKm2(null);
    setSelectedTambon(null);
    setSelectedTambonPostcodes([]);
    setSelectedAmphoePostcodes([]);
    setSelectedProvince(null);
    setSelectedAmphoeAreaKm2(null);
    setErrorAmphoe(null);
    setErrorTambon(null);
    setErrorPostcodes(null);
  };

  const handleBackToProvince = () => {
    stopTour();
    setViewState('PROVINCE');
    setSelectedTambon(null);
    setSelectedTambonPostcodes([]);
    setSelectedAmphoePostcodes([]);
    setSelectedAmphoeAreaKm2(null);
    setErrorTambon(null);
    setErrorPostcodes(null);
  };

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current || !window.d3) return;
    stopTour();
    const d3 = window.d3;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, factor);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    }
  };

  const handleSearchSelect = async (result: SearchResult) => {
    setSearchTerm("");
    if (result.type === 'province') {
      await selectProvinceByName(result.provinceName);
      return;
    }
    if (result.type === 'amphoe' && result.amphoeName) {
      await selectAmphoeByName(result.provinceName, result.amphoeName);
      return;
    }
    if (result.type === 'tambon' && result.amphoeName && result.tambonName) {
      await selectTambonByName(result.provinceName, result.amphoeName, result.tambonName);
    }
  };

  const handleTambonListSelect = (item: TambonListItem) => {
    const nameEn = item.nameEn || item.nameTh;
    if (!nameEn) return;
    setSelectedTambon({
      name: nameEn,
      properties: {
        NAME_3: item.nameEn,
        NL_NAME_3: item.nameTh
      }
    });
    setSelectedTambonPostcodes([]);
    void loadPostcodeData();
  };

  const handleToggleTour = () => {
    if (tourActive) {
      setTourActive(false);
      setTourRegionKey(null);
      return;
    }
    handleBackToCountry();
    setTourIndex(0);
    setTourActive(true);
  };

  const handleRegionClick = useCallback((regionKey: string, options?: { fromTour?: boolean }) => {
    if (!provinceData || !svgRef.current || !zoomRef.current || !window.d3) return;
    const d3 = window.d3;
    const width = 800;
    const height = 1200;

    if (!options?.fromTour) {
      setTourActive(false);
      setTourRegionKey(null);
    }

    // 1. Filter features for this region
    const regionFeatures = provinceData.features.filter(f => {
      const pName = getThaiName(f.properties);
      return getRegionByProvince(pName) === regionKey;
    });

    if (regionFeatures.length === 0) return;

    // 2. Re-calculate projection to get bounds (must match initial render)
    const projection = d3.geoMercator().fitExtent(
      [[20, 20], [width - 20, height - 20]],
      provinceData
    );
    const pathGenerator = d3.geoPath().projection(projection);

    // 3. Calculate bounds of the region
    const bounds = pathGenerator.bounds({ type: "FeatureCollection", features: regionFeatures });
    const [[x0, y0], [x1, y1]] = bounds;

    // 4. Calculate transform
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
  }, [provinceData]);

  useEffect(() => {
    if (!tourActive || viewState !== 'COUNTRY' || !provinceData) return;
    const regionKeys = Object.keys(REGION_CONFIG);
    if (regionKeys.length === 0) return;
    const currentKey = regionKeys[tourIndex % regionKeys.length];
    setTourRegionKey(currentKey);
    handleRegionClick(currentKey, { fromTour: true });
    const timer = setTimeout(() => {
      setTourIndex((prev) => (prev + 1) % regionKeys.length);
    }, 4500);
    return () => clearTimeout(timer);
  }, [tourActive, tourIndex, viewState, provinceData, handleRegionClick]);

  const hoverTypeLabel =
    viewState === 'COUNTRY' ? t.typeProvince : viewState === 'PROVINCE' ? t.typeAmphoe : t.typeTambon;

  const selectedProvinceLabel = selectedProvince ? getProvinceDisplayName(selectedProvince.properties) : "";
  const selectedAmphoeLabel = selectedAmphoe ? getAmphoeDisplayName(selectedAmphoe.properties) : "";
  const selectedTambonLabel = selectedTambon
    ? getTambonDisplayName(
      selectedTambon.properties,
      getProvinceNameEn(selectedTambon.properties),
      getAmphoeNameEn(selectedTambon.properties)
    )
    : "";
  const showTambonMap = viewState !== 'AMPHOE' || tambonMapAvailable;
  const selectedTambonKey = selectedTambon ? normalizeAdminKey(selectedTambon.name) : "";
  const amphoePostalPreview = selectedAmphoePostcodes.slice(0, 4);
  const amphoePostalRemaining = selectedAmphoePostcodes.length - amphoePostalPreview.length;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 relative overflow-hidden">

      {/* --- Map Area --- */}
      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: viewState === 'COUNTRY' ? '#eff6ff' : '#f0f9ff' }}>

        <div className="absolute inset-0 z-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

        {/* Loading / Error States */}
        {(loading || loadingAmphoe || loadingTambon) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-bold text-blue-800">
              {loading
                ? t.loadingCountry
                : loadingAmphoe
                  ? t.loadingAmphoe
                  : t.loadingTambon}
            </p>
          </div>
        )}

        {(errorAmphoe || errorTambon) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-50 p-6 rounded-xl border border-red-200 shadow-xl text-center max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 mb-2">{t.errorTitle}</h3>
            <p className="text-red-600 mb-4">{errorTambon || errorAmphoe}</p>
            <button
              onClick={handleBackToCountry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {t.errorBackHome}
            </button>
          </div>
        )}

        {/* Map Container */}
        <div className="z-10 relative w-full h-full flex flex-col items-center justify-center">

          {/* Header / Back Button */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-3 w-72 max-w-[calc(100vw-2rem)]">
            {viewState === 'AMPHOE' ? (
              <button
                onClick={handleBackToProvince}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 font-bold"
              >
                <ChevronLeft className="w-5 h-5" /> {t.backToAmphoe}
              </button>
            ) : viewState === 'PROVINCE' ? (
              <button
                onClick={handleBackToCountry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 font-bold"
              >
                <ChevronLeft className="w-5 h-5" /> {t.backToCountry}
              </button>
            ) : (
              <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Compass className="w-6 h-6 text-blue-600" /> {t.mapTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{t.mapSubtitle}</p>
              </div>
            )}

            <div className="bg-white/90 backdrop-blur-md px-3 py-3 rounded-xl shadow-lg border border-white/50 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${showLabels ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <Type className="w-4 h-4" />
                  {showLabels ? t.toggleLabelsHide : t.toggleLabelsShow}
                </button>
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${focusMode ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <Sparkles className="w-4 h-4" /> {t.focusMode}
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${copiedLink ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <Share2 className="w-4 h-4" /> {copiedLink ? t.linkCopied : t.shareLink}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                  <button
                    onClick={() => setMapLayer('REGION')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${mapLayer === 'REGION' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {t.layerRegion}
                  </button>
                  <button
                    onClick={() => setMapLayer('AREA')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${mapLayer === 'AREA' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {t.layerArea}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                  <button
                    onClick={() => setLanguage('TH')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${language === 'TH' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    ไทย
                  </button>
                  <button
                    onClick={() => setLanguage('EN')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${language === 'EN' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-3 py-3 rounded-xl shadow-lg border border-white/50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="mt-2 max-h-64 overflow-auto space-y-1">
                  {loadingPostcodes && !postcodeData && (
                    <p className="text-xs text-slate-500 px-2 py-1.5">{t.searchLoading}</p>
                  )}
                  {searchResults.length === 0 && !loadingPostcodes && (
                    <p className="text-xs text-slate-500 px-2 py-1.5">{t.searchNoResults}</p>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSearchSelect(result)}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-700">{result.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${result.type === 'province'
                              ? "bg-emerald-100 text-emerald-700"
                              : result.type === 'amphoe'
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {result.type === 'province' ? t.typeProvince : result.type === 'amphoe' ? t.typeAmphoe : t.typeTambon}
                        </span>
                      </div>
                      {result.sublabel && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{result.sublabel}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {viewState === 'AMPHOE' && !tambonMapAvailable && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md px-5 py-4 rounded-2xl shadow-lg border border-white/60 text-center max-w-xs">
                <p className="text-sm font-semibold text-slate-700">{t.tambonMapUnavailableTitle}</p>
                <p className="text-xs text-slate-500 mt-1">{t.tambonMapUnavailableHint}</p>
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          {showTambonMap && (
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-20">
              <button
                onClick={() => handleZoom(1.3)}
                className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg border border-slate-200 transition-transform active:scale-95"
              >
                <Plus className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleZoom(0.7)}
                className="p-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg border border-slate-200 transition-transform active:scale-95"
              >
                <Minus className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Legend */}
          {viewState === 'COUNTRY' && (
            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 z-20 hidden md:block">
              <h3 className="text-sm font-bold text-slate-700 mb-3">{t.legendTitle}</h3>
              <div className="space-y-2">
                {Object.entries(REGION_CONFIG).map(([key, config]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
                    onClick={() => handleRegionClick(key)}
                  >
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: config.color }}></span>
                    <span className="text-xs text-slate-600">{getRegionLabel(key)}</span>
                  </div>
                ))}
              </div>
              {mapLayer === 'AREA' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>{t.legendSmall}</span>
                    <span>{t.legendLarge}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-100 via-cyan-400 to-blue-700"></div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={handleToggleTour}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${tourActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  {tourActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {tourActive ? t.tourStop : t.tourStart}
                </button>
                {tourActive && tourRegionKey && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t.touringPrefix} {getRegionLabel(tourRegionKey)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hover Tooltip */}
          {hoveredFeature && hoveredPosition && (
            <div
              className="fixed z-50 pointer-events-none bg-slate-900/95 text-white px-3 py-2 rounded-xl shadow-2xl border border-slate-700/60 backdrop-blur-sm"
              style={{ left: hoveredPosition.x + 14, top: hoveredPosition.y + 14 }}
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-300">{hoverTypeLabel}</p>
              <p className="text-sm font-bold leading-tight">{hoveredFeature}</p>
              {viewState === 'COUNTRY' && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {getRegionLabel(getRegionByProvince(hoveredFeature))}
                </p>
              )}
            </div>
          )}

          {/* SVG Render */}
          {showTambonMap && (
            <svg
              ref={svgRef}
              viewBox="0 0 800 1200"
              className="w-full h-full transition-all duration-700 ease-in-out drop-shadow-2xl"
              style={{ filter: "drop-shadow(0px 15px 15px rgba(0,0,0,0.15))" }}
            ></svg>
          )}
        </div>
      </div>

      {/* --- Sidebar Info --- */}
      <div className={`
        fixed inset-y-0 right-0 w-full md:w-96 bg-white/90 backdrop-blur-md shadow-2xl transform transition-transform duration-300 z-30 overflow-y-auto
        ${(selectedProvince || selectedAmphoe) ? 'translate-x-0' : 'translate-x-full'}
      `}>

        <div className="p-6 border-b border-slate-100 bg-white/50 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            {viewState === 'AMPHOE' ? t.sidebarTitleTambon : viewState === 'PROVINCE' ? t.sidebarTitleAmphoe : t.sidebarTitleProvince}
          </h1>
          <button onClick={handleBackToCountry} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {viewState === 'COUNTRY' && !selectedProvince ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
              <div className="bg-slate-100 p-6 rounded-full mb-6">
                <MapPin className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-600">{t.emptyCountryTitle}</p>
              <p className="text-sm text-slate-400 mt-2 text-center max-w-[200px]">
                {t.emptyCountryHint}
              </p>
            </div>
          ) : selectedProvince ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <span onClick={handleBackToCountry} className="cursor-pointer hover:text-blue-600">{t.breadcrumbCountry}</span>
                <span>/</span>
                <span
                  onClick={viewState === 'AMPHOE' ? handleBackToProvince : undefined}
                  className={`font-bold text-slate-800 ${viewState === 'AMPHOE' ? 'cursor-pointer hover:text-blue-600' : ''}`}
                >
                  {selectedProvinceLabel}
                </span>
                {viewState === 'AMPHOE' && selectedAmphoe && (
                  <>
                    <span>/</span>
                    <span className="font-bold text-slate-800">{selectedAmphoeLabel}</span>
                  </>
                )}
              </div>

              <div className="text-center pb-6 border-b border-slate-100">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-white mb-3 shadow-sm"
                  style={{ backgroundColor: REGION_CONFIG[selectedProvince.region].color }}>
                  {getRegionLabel(selectedProvince.region)}
                </span>
                <h2 className="text-4xl font-extrabold text-slate-800">{selectedProvinceLabel}</h2>
              </div>

              {selectedAmphoe ? (
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 animate-slide-up">
                  <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 tracking-wide flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {t.selectedAmphoeTitle}
                  </h3>
                  <p className="text-2xl font-bold text-blue-900 mb-2">{selectedAmphoeLabel}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                      <p className="text-xs text-slate-400">{t.allPostcodes}</p>
                      {loadingPostcodes ? (
                        <p className="text-xs text-slate-500 mt-2">{t.postcodesLoading}</p>
                      ) : errorPostcodes ? (
                        <p className="text-xs text-red-600 mt-2">{errorPostcodes}</p>
                      ) : selectedAmphoePostcodes.length > 0 ? (
                        <div className="mt-2 flex flex-wrap justify-center gap-1">
                          {amphoePostalPreview.map((code) => (
                            <span
                              key={code}
                              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {code}
                            </span>
                          ))}
                          {amphoePostalRemaining > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold">
                              +{amphoePostalRemaining}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2">{t.postcodesNotFound}</p>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                      <p className="text-xs text-slate-400">{t.area}</p>
                      <p className="font-bold text-slate-700">
                        {selectedAmphoeAreaKm2 != null
                          ? `${formatAreaKm2(selectedAmphoeAreaKm2)} km²`
                          : t.areaUnknown}
                      </p>
                    </div>
                  </div>
                </div>
              ) : viewState === 'PROVINCE' ? (
                <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center py-8">
                  <p className="text-slate-400 mb-2">{t.noAmphoeTitle}</p>
                  <p className="text-sm text-slate-500">{t.noAmphoeHint}</p>
                </div>
              ) : null}

              {viewState === 'AMPHOE' && (
                !tambonMapAvailable && (
                  <div className="bg-white/90 p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {t.tambonFallbackListTitle}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{t.tambonFallbackListHint}</p>
                    {loadingPostcodes ? (
                      <p className="text-sm text-slate-500">{t.postcodesLoading}</p>
                    ) : errorPostcodes ? (
                      <p className="text-sm text-red-600">{errorPostcodes}</p>
                    ) : tambonFallbackList.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-auto pr-1">
                        {tambonFallbackList.map((item) => {
                          const displayName = language === 'TH' ? item.nameTh : item.nameEn;
                          const itemKey = normalizeAdminKey(item.nameEn || item.nameTh);
                          const isSelected = Boolean(selectedTambonKey && itemKey === selectedTambonKey);
                          const visibleCodes = item.postalCodes.slice(0, 5);
                          const remaining = item.postalCodes.length - visibleCodes.length;
                          return (
                            <button
                              key={`${itemKey}-${item.nameEn}`}
                              onClick={() => handleTambonListSelect(item)}
                              className={`w-full text-left px-3 py-2 rounded-xl border transition ${isSelected
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-700">
                                  {displayName || item.nameEn || item.nameTh}
                                </span>
                                {item.postalCodes.length > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                                    {item.postalCodes.length} {t.postalCode}
                                  </span>
                                )}
                              </div>
                              {item.postalCodes.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {visibleCodes.map((code) => (
                                    <span
                                      key={code}
                                      className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-semibold border border-slate-200"
                                    >
                                      {code}
                                    </span>
                                  ))}
                                  {remaining > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                      +{remaining}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">{t.tambonFallbackEmpty}</p>
                    )}
                  </div>
                )
              )}

              {viewState === 'AMPHOE' && (
                selectedTambon ? (
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 animate-slide-up">
                    <h3 className="text-xs font-bold text-emerald-500 uppercase mb-3 tracking-wide flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {t.selectedTambonTitle}
                    </h3>
                    <p className="text-2xl font-bold text-emerald-900 mb-2">{selectedTambonLabel}</p>
                    <div className="mt-4">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                        {t.allPostcodes}
                      </p>
                      {loadingPostcodes ? (
                        <p className="text-sm text-slate-500 mt-2">{t.postcodesLoading}</p>
                      ) : errorPostcodes ? (
                        <p className="text-sm text-red-600 mt-2">{errorPostcodes}</p>
                      ) : selectedTambonPostcodes.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedTambonPostcodes.map((code) => (
                            <span
                              key={code}
                              className="px-2.5 py-1 rounded-full bg-white text-emerald-800 text-xs font-semibold shadow-sm border border-emerald-100"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-2">{t.postcodesNotFound}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center py-8">
                    <p className="text-slate-400 mb-2">{t.noTambonTitle}</p>
                    <p className="text-sm text-slate-500">
                      {tambonMapAvailable ? t.noTambonHint : t.noTambonHintList}
                    </p>
                  </div>
                )
              )}

              <button
                onClick={viewState === 'AMPHOE' ? handleBackToProvince : handleBackToCountry}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium mt-auto"
              >
                <ChevronLeft className="w-5 h-5" /> {viewState === 'AMPHOE' ? t.backToAmphoe : t.backToOtherProvinces}
              </button>
            </div>
          ) : (
            <div>{t.loadingFallback}</div>
          )}

        </div>
      </div>
    </div>
  );
}
