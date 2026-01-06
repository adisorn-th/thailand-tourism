"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, Info, Compass, X, Type, ChevronLeft, AlertCircle, Plus, Minus, Search, Sparkles, Play, Pause, Share2, Layers } from 'lucide-react';

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

interface SearchIndexItem extends SearchResult {
  searchKey: string;
}

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

const normalizeProvinceName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^(จ\.|จังหวัด|จ )/, "")
    .replace(/province$/i, "")
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

const isValidName = (value?: string): value is string =>
  Boolean(value && value !== "NA");

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
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<any>(null);

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
         if(!res.ok) throw new Error("Failed to load province data");
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
        if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: GeoJSONData = await res.json();
        
        setAmphoeData(data);
        setLoadingAmphoe(false);
        return data; 
      } catch (err) {
        console.warn(`Failed to load from ${url}:`, err);
      }
    }

    setErrorAmphoe("ไม่สามารถโหลดข้อมูลอำเภอได้ (กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต)");
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

    setErrorTambon("ไม่สามารถโหลดข้อมูลตำบลได้ (กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต)");
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

    setErrorPostcodes("ไม่สามารถโหลดรหัสไปรษณีย์ได้");
    setLoadingPostcodes(false);
    return null;
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
      setViewState('PROVINCE');
      return;
    }

    setSelectedAmphoe({ name: getThaiName(amphoeFeature.properties), properties: amphoeFeature.properties });
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
    if (!searchTerm.trim()) return;
    if (!postcodeData && !loadingPostcodes) {
      void loadPostcodeData();
    }
  }, [searchTerm, postcodeData, loadingPostcodes]);

  const searchIndex = useMemo(() => {
    const items: SearchIndexItem[] = [];

    if (postcodeData) {
      const provinceByCode = new Map<number, ProvinceEntry>();
      const districtByCode = new Map<number, DistrictEntry>();

      postcodeData.provinces.forEach((province) => {
        provinceByCode.set(province.provinceCode, province);
        const label = province.provinceNameTh || province.provinceNameEn;
        const sublabel = province.provinceNameTh ? province.provinceNameEn : undefined;
        const searchKey = normalizeSearchText(`${province.provinceNameTh} ${province.provinceNameEn}`);
        if (!searchKey) return;
        items.push({
          id: `province-${province.provinceCode}`,
          type: 'province',
          label,
          sublabel,
          provinceName: province.provinceNameEn,
          searchKey
        });
      });

      postcodeData.districts.forEach((district) => {
        districtByCode.set(district.districtCode, district);
        const province = provinceByCode.get(district.provinceCode);
        if (!province) return;
        const label = district.districtNameTh || district.districtNameEn;
        const sublabel = province.provinceNameTh || province.provinceNameEn;
        const searchKey = normalizeSearchText(
          `${district.districtNameTh} ${district.districtNameEn} ${province.provinceNameTh} ${province.provinceNameEn}`
        );
        if (!searchKey) return;
        items.push({
          id: `amphoe-${district.districtCode}`,
          type: 'amphoe',
          label,
          sublabel,
          provinceName: province.provinceNameEn,
          amphoeName: district.districtNameEn,
          searchKey
        });
      });

      postcodeData.subdistricts.forEach((subdistrict) => {
        const province = provinceByCode.get(subdistrict.provinceCode);
        const district = districtByCode.get(subdistrict.districtCode);
        if (!province || !district) return;
        const label = subdistrict.subdistrictNameTh || subdistrict.subdistrictNameEn;
        const sublabel = `${district.districtNameTh || district.districtNameEn} • ${province.provinceNameTh || province.provinceNameEn}`;
        const searchKey = normalizeSearchText(
          `${subdistrict.subdistrictNameTh} ${subdistrict.subdistrictNameEn} ${district.districtNameTh} ${district.districtNameEn} ${province.provinceNameTh} ${province.provinceNameEn}`
        );
        if (!searchKey) return;
        items.push({
          id: `tambon-${subdistrict.subdistrictCode}`,
          type: 'tambon',
          label,
          sublabel,
          provinceName: province.provinceNameEn,
          amphoeName: district.districtNameEn,
          tambonName: subdistrict.subdistrictNameEn,
          searchKey
        });
      });
    } else if (provinceData) {
      provinceData.features.forEach((feature, index) => {
        const label = getThaiName(feature.properties);
        const searchKey = normalizeSearchText(label);
        if (!searchKey) return;
        items.push({
          id: `province-geo-${index}`,
          type: 'province',
          label,
          provinceName: label,
          searchKey
        });
      });
    }

    return items;
  }, [postcodeData, provinceData]);

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
      .filter((entry): entry is { item: SearchResult; score: number } => Boolean(entry))
      .sort((a, b) => a.score - b.score || a.item.label.length - b.item.label.length)
      .slice(0, 12)
      .map((entry) => entry.item);

    return scored;
  }, [searchIndex, searchTerm]);

  useEffect(() => {
    if (deepLinkApplied || !provinceData) return;

    const params = new URLSearchParams(window.location.search);
    if (params.toString().length === 0) {
      setDeepLinkApplied(true);
      return;
    }

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

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [deepLinkApplied, selectedProvince, selectedAmphoe, selectedTambon, viewState, mapLayer, showLabels, focusMode]);

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
    let getFeatureName: (d: GeoJSONFeature) => string;
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
      getFeatureName = (d: GeoJSONFeature) => getThaiName(d.properties);

    } else if (viewState === 'PROVINCE') {
      if (!amphoeData || !selectedProvince) return; 

      const targetProvinceName = selectedProvince.name;
      const targetKey = normalizeProvinceKey(targetProvinceName);
      featuresToRender = amphoeData.features.filter(f => {
         const pName = getProvinceNameFromFeature(f.properties);
         const pKey = normalizeProvinceKey(pName);
         return pKey === targetKey || pKey.includes(targetKey) || targetKey.includes(pKey);
      });

      if (featuresToRender.length === 0) {
          console.warn("No amphoes found for", targetProvinceName);
      }

      if (featuresToRender.length > 0) {
        projection = d3.geoMercator().fitExtent(
            [[20, 20], [width - 20, height - 20]], 
            { type: "FeatureCollection", features: featuresToRender }
        );
      } else {
        projection = d3.geoMercator().center([100.5, 13.5]).scale(2500).translate([width/2, height/2]);
      }

      const regionColor = REGION_CONFIG[selectedProvince.region].color;
      const colorScale = d3.scaleLinear()
        .domain([0, featuresToRender.length])
        .range([d3.rgb(regionColor).brighter(0.8), d3.rgb(regionColor).darker(0.3)]);

      getFillColor = (d: GeoJSONFeature, i: number) => colorScale(i);
      getFeatureName = (d: GeoJSONFeature) => getThaiName(d.properties);
    } else if (viewState === 'AMPHOE') {
      if (!tambonData || !selectedProvince || !selectedAmphoe) return;

      const targetProvinceKey = normalizeProvinceKey(selectedProvince.name);
      const targetAmphoeKey = normalizeAdminKey(selectedAmphoe.name);
      featuresToRender = tambonData.features.filter(f => {
         const provinceName = getProvinceNameFromFeature(f.properties);
         const amphoeName = getAmphoeNameFromTambon(f.properties);
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

      if (featuresToRender.length === 0) {
          console.warn("No tambons found for", selectedAmphoe.name);
      }

      if (featuresToRender.length > 0) {
        projection = d3.geoMercator().fitExtent(
            [[20, 20], [width - 20, height - 20]], 
            { type: "FeatureCollection", features: featuresToRender }
        );
      } else {
        projection = d3.geoMercator().center([100.5, 13.5]).scale(2500).translate([width/2, height/2]);
      }

      const regionColor = REGION_CONFIG[selectedProvince.region].color;
      const colorScale = d3.scaleLinear()
        .domain([0, featuresToRender.length])
        .range([d3.rgb(regionColor).brighter(0.9), d3.rgb(regionColor).darker(0.2)]);

      getFillColor = (d: GeoJSONFeature, i: number) => colorScale(i);
      getFeatureName = (d: GeoJSONFeature) => getThaiName(d.properties);
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
        .on("mouseover", function(this: any, event: any, d: GeoJSONFeature) {
            const name = getFeatureName(d);
            setHoveredFeature(name);
            setHoveredPosition({ x: event.clientX, y: event.clientY });
            d3.select(this)
            .attr("fill", "#FACC15")
            .attr("stroke-width", 2)
            .raise();
            if (focusMode && !tourActive) {
                gPaths.selectAll("path").attr("opacity", 0.3);
                d3.select(this).attr("opacity", 1);
            }
        })
        .on("mousemove", function(this: any, event: any) {
            setHoveredPosition({ x: event.clientX, y: event.clientY });
        })
        .on("mouseout", function(this: any, event: any, d: GeoJSONFeature, i: number) {
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
        .on("click", async function(this: any, event: any, d: GeoJSONFeature) {
            const name = getFeatureName(d);
            stopTour();
            
            if (viewState === 'COUNTRY') {
                const region = getRegionByProvince(name);
                const provData: SelectedProvince = { name, region, properties: d.properties };
                
                setSelectedProvince(provData);
                await loadAmphoeData(); 
                
                setViewState('PROVINCE');
                setSelectedAmphoe(null); 
                setSelectedTambon(null);
                setSelectedTambonPostcodes([]);
                setErrorPostcodes(null);

            } else if (viewState === 'PROVINCE') {
                setSelectedAmphoe({
                    name: name,
                    properties: d.properties
                });
                setSelectedTambon(null);
                setSelectedTambonPostcodes([]);
                
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
            .attr("transform", function(d: GeoJSONFeature) {
                const centroid = pathGenerator.centroid(d);
                if (isNaN(centroid[0])) return "translate(-100,-100)";
                return "translate(" + centroid[0] + "," + centroid[1] + ")";
            })
            .attr("dy", ".35em")
            .text((d: GeoJSONFeature) => getFeatureName(d))
            .attr("text-anchor", "middle")
            .attr("font-size", viewState === 'PROVINCE' ? "10px" : "8px") 
            .attr("font-weight", viewState === 'COUNTRY' ? "bold" : "normal")
            .attr("fill", "#1F2937")
            .attr("pointer-events", "none")
            .style("text-shadow", "2px 0 #fff, -2px 0 #fff, 0 2px #fff, 0 -2px #fff")
            .style("opacity", 0.9);
        }

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

  }, [d3Loaded, provinceData, amphoeData, tambonData, viewState, selectedProvince, selectedAmphoe, selectedTambon, showLabels, mapLayer, focusMode, tourActive, tourRegionKey]);

  const handleBackToCountry = () => {
      stopTour();
      setViewState('COUNTRY');
      setSelectedAmphoe(null);
      setSelectedTambon(null);
      setSelectedTambonPostcodes([]);
      setSelectedProvince(null);
      setErrorAmphoe(null);
      setErrorTambon(null);
      setErrorPostcodes(null);
  };

  const handleBackToProvince = () => {
      stopTour();
      setViewState('PROVINCE');
      setSelectedTambon(null);
      setSelectedTambonPostcodes([]);
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
    viewState === 'COUNTRY' ? 'จังหวัด' : viewState === 'PROVINCE' ? 'อำเภอ' : 'ตำบล';

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
                  ? "กำลังโหลดแผนที่ประเทศไทย..."
                  : loadingAmphoe
                    ? "กำลังโหลดข้อมูลอำเภอ..."
                    : "กำลังโหลดข้อมูลตำบล..."}
            </p>
          </div>
        )}

        {(errorAmphoe || errorTambon) && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-50 p-6 rounded-xl border border-red-200 shadow-xl text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-red-600 mb-4">{errorTambon || errorAmphoe}</p>
                <button 
                    onClick={handleBackToCountry}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    กลับไปหน้าหลัก
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
                        <ChevronLeft className="w-5 h-5" /> กลับไปเลือกอำเภอ
                    </button>
                ) : viewState === 'PROVINCE' ? (
                    <button 
                        onClick={handleBackToCountry}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 font-bold"
                    >
                        <ChevronLeft className="w-5 h-5" /> กลับไปหน้าประเทศไทย
                    </button>
                ) : (
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Compass className="w-6 h-6 text-blue-600" /> แผนที่ประเทศไทย
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">คลิกที่จังหวัดเพื่อดูรายอำเภอ</p>
                    </div>
                )}

                <div className="bg-white/90 backdrop-blur-md px-3 py-3 rounded-xl shadow-lg border border-white/50 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setShowLabels(!showLabels)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
                        showLabels ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Type className="w-4 h-4" /> 
                      {showLabels ? "ซ่อนชื่อ" : "แสดงชื่อ"}
                    </button>
                    <button 
                      onClick={() => setFocusMode(!focusMode)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
                        focusMode ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> โหมดโฟกัส
                    </button>
                    <button 
                      onClick={handleCopyLink}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
                        copiedLink ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Share2 className="w-4 h-4" /> {copiedLink ? "คัดลอกแล้ว" : "แชร์ลิงก์"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                      <button
                        onClick={() => setMapLayer('REGION')}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                          mapLayer === 'REGION' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ภูมิภาค
                      </button>
                      <button
                        onClick={() => setMapLayer('AREA')}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                          mapLayer === 'AREA' ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ขนาดพื้นที่
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
                      placeholder="ค้นหาจังหวัด/อำเภอ/ตำบล"
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
                        <p className="text-xs text-slate-500 px-2 py-1.5">กำลังโหลดฐานข้อมูลค้นหา...</p>
                      )}
                      {searchResults.length === 0 && !loadingPostcodes && (
                        <p className="text-xs text-slate-500 px-2 py-1.5">ไม่พบผลลัพธ์</p>
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
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                result.type === 'province'
                                  ? "bg-emerald-100 text-emerald-700"
                                  : result.type === 'amphoe'
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {result.type === 'province' ? "จังหวัด" : result.type === 'amphoe' ? "อำเภอ" : "ตำบล"}
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

            {/* Zoom Controls */}
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

            {/* Legend */}
            {viewState === 'COUNTRY' && (
                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-100 z-20 hidden md:block">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">ภูมิภาค</h3>
                    <div className="space-y-2">
                        {Object.entries(REGION_CONFIG).map(([key, config]) => (
                            <div 
                                key={key} 
                                className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
                                onClick={() => handleRegionClick(key)}
                            >
                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: config.color }}></span>
                                <span className="text-xs text-slate-600">{config.name}</span>
                            </div>
                        ))}
                    </div>
                    {mapLayer === 'AREA' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>เล็ก</span>
                          <span>ใหญ่</span>
                        </div>
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-100 via-cyan-400 to-blue-700"></div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={handleToggleTour}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          tourActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {tourActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {tourActive ? "หยุดทัวร์ภาค" : "เริ่มทัวร์ภาค"}
                      </button>
                      {tourActive && tourRegionKey && (
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          กำลังพาเที่ยว {REGION_CONFIG[tourRegionKey].name}
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
                      {REGION_CONFIG[getRegionByProvince(hoveredFeature)].name}
                    </p>
                  )}
               </div>
            )}

            {/* SVG Render */}
            <svg 
                ref={svgRef} 
                viewBox="0 0 800 1200" 
                className="w-full h-full transition-all duration-700 ease-in-out drop-shadow-2xl"
                style={{ filter: "drop-shadow(0px 15px 15px rgba(0,0,0,0.15))" }}
            ></svg>
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
                {viewState === 'AMPHOE' ? 'ข้อมูลตำบล' : viewState === 'PROVINCE' ? 'ข้อมูลอำเภอ' : 'ข้อมูลจังหวัด'}
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
               <p className="text-lg font-medium text-slate-600">เลือกจังหวัดเพื่อดูข้อมูลลึก</p>
               <p className="text-sm text-slate-400 mt-2 text-center max-w-[200px]">
                   คลิกที่จังหวัดใดก็ได้ เช่น "เชียงราย" ระบบจะแสดงแผนที่รายอำเภอ
               </p>
            </div>
          ) : selectedProvince ? (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span onClick={handleBackToCountry} className="cursor-pointer hover:text-blue-600">ประเทศไทย</span>
                    <span>/</span>
                    <span
                      onClick={viewState === 'AMPHOE' ? handleBackToProvince : undefined}
                      className={`font-bold text-slate-800 ${viewState === 'AMPHOE' ? 'cursor-pointer hover:text-blue-600' : ''}`}
                    >
                      {selectedProvince.name}
                    </span>
                    {viewState === 'AMPHOE' && selectedAmphoe && (
                      <>
                        <span>/</span>
                        <span className="font-bold text-slate-800">{selectedAmphoe.name}</span>
                      </>
                    )}
                 </div>

                 <div className="text-center pb-6 border-b border-slate-100">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-white mb-3 shadow-sm" 
                          style={{ backgroundColor: REGION_CONFIG[selectedProvince.region].color }}>
                      {REGION_CONFIG[selectedProvince.region].name}
                    </span>
                    <h2 className="text-4xl font-extrabold text-slate-800">{selectedProvince.name}</h2>
                 </div>

                 {selectedAmphoe ? (
                     <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 animate-slide-up">
                        <h3 className="text-xs font-bold text-blue-400 uppercase mb-3 tracking-wide flex items-center gap-2">
                             <MapPin className="w-4 h-4" /> อำเภอที่เลือก
                        </h3>
                        <p className="text-2xl font-bold text-blue-900 mb-2">{selectedAmphoe.name}</p>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                             <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                                 <p className="text-xs text-slate-400">รหัสไปรษณีย์</p>
                                 <p className="font-bold text-slate-700">{(Math.random()*10000 + 50000).toFixed(0)}</p>
                             </div>
                             <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                                 <p className="text-xs text-slate-400">พื้นที่ (km²)</p>
                                 <p className="font-bold text-slate-700">{(Math.random()*500 + 100).toFixed(0)}</p>
                             </div>
                        </div>
                     </div>
                 ) : viewState === 'PROVINCE' ? (
                     <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center py-8">
                         <p className="text-slate-400 mb-2">ยังไม่ได้เลือกอำเภอ</p>
                         <p className="text-sm text-slate-500">คลิกที่อำเภอในแผนที่เพื่อดูตำบล</p>
                     </div>
                 ) : null}

                 {viewState === 'AMPHOE' && (
                   selectedTambon ? (
                     <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 animate-slide-up">
                        <h3 className="text-xs font-bold text-emerald-500 uppercase mb-3 tracking-wide flex items-center gap-2">
                             <MapPin className="w-4 h-4" /> ตำบลที่เลือก
                        </h3>
                        <p className="text-2xl font-bold text-emerald-900 mb-2">{selectedTambon.name}</p>
                        <div className="mt-4">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                              รหัสไปรษณีย์ทั้งหมด
                            </p>
                            {loadingPostcodes ? (
                              <p className="text-sm text-slate-500 mt-2">กำลังโหลดรหัสไปรษณีย์...</p>
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
                              <p className="text-sm text-slate-500 mt-2">ไม่พบรหัสไปรษณีย์</p>
                            )}
                        </div>
                     </div>
                   ) : (
                     <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center py-8">
                         <p className="text-slate-400 mb-2">ยังไม่ได้เลือกตำบล</p>
                         <p className="text-sm text-slate-500">คลิกที่พื้นที่ในแผนที่เพื่อดูข้อมูลตำบล</p>
                     </div>
                   )
                 )}

                 <button 
                    onClick={viewState === 'AMPHOE' ? handleBackToProvince : handleBackToCountry}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium mt-auto"
                 >
                    <ChevronLeft className="w-5 h-5" /> {viewState === 'AMPHOE' ? 'กลับไปเลือกอำเภอ' : 'กลับไปเลือกจังหวัดอื่น'}
                 </button>
            </div>
          ) : (
             <div>Loading...</div>
          )}

        </div>
      </div>
    </div>
  );
}
