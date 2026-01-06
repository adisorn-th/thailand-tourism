"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Info, Compass, X, Type, ChevronLeft, AlertCircle, Plus, Minus } from 'lucide-react';

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

// --- CONFIGURATION ---
const REGION_CONFIG: RegionConfig = {
  "North": { name: "ภาคเหนือ", color: "#16A34A", textColor: "#FFFFFF", description: "ดินแดนแห่งขุนเขา ทะเลหมอก และวัฒนธรรมล้านนา", provinces: ["เชียงราย", "เชียงใหม่", "น่าน", "พะเยา", "แพร่", "แม่ฮ่องสอน", "ลำปาง", "ลำพูน", "อุตรดิตถ์"] },
  "Northeast": { name: "ภาคตะวันออกเฉียงเหนือ", color: "#EA580C", textColor: "#FFFFFF", description: "ดินแดนที่ราบสูง แหล่งไดโนเสาร์ และอารยธรรมขอม", provinces: ["กาฬสินธุ์", "ขอนแก่น", "ชัยภูมิ", "นครพนม", "นครราชสีมา", "บึงกาฬ", "บุรีรัมย์", "มหาสารคาม", "มุกดาหาร", "ยโสธร", "ร้อยเอ็ด", "เลย", "สกลนคร", "สุรินทร์", "ศรีสะเกษ", "หนองคาย", "หนองบัวลำภู", "อุดรธานี", "อุบลราชธานี", "อำนาจเจริญ"] },
  "Central": { name: "ภาคกลาง", color: "#DB2777", textColor: "#FFFFFF", description: "อู่ข้าวอู่น้ำ พื้นที่ราบลุ่มแม่น้ำเจ้าพระยา", provinces: ["กรุงเทพมหานคร", "กรุงเทพฯ", "กำแพงเพชร", "ชัยนาท", "นครนายก", "นครปฐม", "นครสวรรค์", "นนทบุรี", "ปทุมธานี", "พระนครศรีอยุธยา", "พิจิตร", "พิษณุโลก", "เพชรบูรณ์", "ลพบุรี", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "อ่างทอง", "อุทัยธานี"] },
  "East": { name: "ภาคตะวันออก", color: "#0891B2", textColor: "#FFFFFF", description: "ประตูสู่เศรษฐกิจโลก สวนผลไม้ และชายหาดสวยงาม", provinces: ["จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ตราด", "ปราจีนบุรี", "ระยอง", "สระแก้ว"] },
  "West": { name: "ภาคตะวันตก", color: "#A16207", textColor: "#FFFFFF", description: "ผืนป่าตะวันตก เขื่อนใหญ่ และประวัติศาสตร์สงคราม", provinces: ["กาญจนบุรี", "ตาก", "ประจวบคีรีขันธ์", "เพชรบุรี", "ราชบุรี"] },
  "South": { name: "ภาคใต้", color: "#2563EB", textColor: "#FFFFFF", description: "ด้ามขวานทอง ขนาบด้วยสองฝั่งทะเล", provinces: ["กระบี่", "ชุมพร", "ตรัง", "นครศรีธรรมราช", "นราธิวาส", "ปัตตานี", "พังงา", "พัทลุง", "ภูเก็ต", "ยะลา", "ระนอง", "สงขลา", "สตูล", "สุราษฎร์ธานี"] }
};

const getRegionByProvince = (provinceName: string): string => {
  const cleanName = provinceName.trim().replace(/^(จ\.|จังหวัด|จ )/, '');
  for (const [regionKey, data] of Object.entries(REGION_CONFIG)) {
    const match = data.provinces.some(p => {
        const cleanP = p.trim();
        return cleanName === cleanP || cleanName.includes(cleanP) || cleanP.includes(cleanName);
    });
    if (match) return regionKey;
  }
  return "Central";
};

// URLs
const URL_PROVINCES = 'https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json';
//const URL_PROVINCES = 'https://raw.githubusercontent.com/thailand-geography/thailand-geography-json/main/src/provinces.json';

const AMPHOE_URL_CANDIDATES = [
  'https://raw.githubusercontent.com/thailand-geography/thailand-geography-json/main/src/amphoe.json',
  'https://raw.githubusercontent.com/apisit/thailand.json/master/amphoe.json'
];

export default function App() {
  // State Types
  const [viewState, setViewState] = useState<'COUNTRY' | 'PROVINCE'>('COUNTRY');
  const [provinceData, setProvinceData] = useState<GeoJSONData | null>(null);
  const [amphoeData, setAmphoeData] = useState<GeoJSONData | null>(null);
  
  const [selectedProvince, setSelectedProvince] = useState<SelectedProvince | null>(null);
  const [selectedAmphoe, setSelectedAmphoe] = useState<SelectedAmphoe | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAmphoe, setLoadingAmphoe] = useState<boolean>(false);
  const [errorAmphoe, setErrorAmphoe] = useState<string | null>(null);
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

  // Helpers
  const getThaiName = (properties: GeoJSONProperties): string => {
      if (properties.name_th) return properties.name_th;
      if (properties.pro_th) return properties.pro_th;
      if (properties.ap_th) return properties.ap_th;
      if (properties.AMP_NAM_T) return properties.AMP_NAM_T;
      if (properties.PROV_NAM_T) return properties.PROV_NAM_T;
      return properties.name || "Unknown";
  };

  const getProvinceNameFromAmphoe = (properties: GeoJSONProperties): string => {
      if (properties.province_th) return properties.province_th;
      if (properties.pro_th) return properties.pro_th;
      if (properties.PROV_NAM_T) return properties.PROV_NAM_T;
      return "";
  };

  // 3. Main D3 Render Logic
  useEffect(() => {
    if (!d3Loaded || !svgRef.current) return;
    
    if (viewState === 'COUNTRY' && !provinceData) return;
    if (viewState === 'PROVINCE' && !selectedProvince) return;

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
      featuresToRender = amphoeData.features.filter(f => {
         const pName = getProvinceNameFromAmphoe(f.properties);
         const cleanPName = pName.trim();
         const cleanTarget = targetProvinceName.trim();
         return cleanPName.includes(cleanTarget) || cleanTarget.includes(cleanPName);
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
    }

    const pathGenerator = d3.geoPath().projection(projection);
    const g = svg.append("g");
    const gPaths = g.append("g").attr("class", "map-paths");
    const gLabels = g.append("g").attr("class", "map-labels");

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
        .attr("fill", (d: GeoJSONFeature, i: number) => getFillColor(d, i))
        .attr("stroke", "#ffffff")
        .attr("stroke-width", viewState === 'PROVINCE' ? 1.5 : 0.5)
        .attr("cursor", "pointer")
        .style("transition", "all 0.2s ease")
        .on("mouseover", function(this: any, event: any, d: GeoJSONFeature) {
            const name = getFeatureName(d);
            setHoveredFeature(name);
            d3.select(this)
            .attr("fill", "#FACC15")
            .attr("stroke-width", 2)
            .raise();
        })
        .on("mouseout", function(this: any, event: any, d: GeoJSONFeature, i: number) {
            setHoveredFeature(null);
            if (viewState === 'PROVINCE') {
                const name = getFeatureName(d);
                if (selectedAmphoe?.name === name) {
                    d3.select(this).attr("fill", "#DC2626");
                } else {
                    d3.select(this).attr("fill", getFillColor(d, i)); 
                }
            } else {
                const name = getFeatureName(d);
                if (selectedProvince?.name !== name) {
                    d3.select(this).attr("fill", getFillColor(d, i));
                } else {
                    d3.select(this).attr("fill", "#DC2626");
                }
            }
        })
        .on("click", async function(this: any, event: any, d: GeoJSONFeature) {
            const name = getFeatureName(d);
            
            if (viewState === 'COUNTRY') {
                const region = getRegionByProvince(name);
                const provData: SelectedProvince = { name, region, properties: d.properties };
                
                setSelectedProvince(provData);
                await loadAmphoeData(); 
                
                setViewState('PROVINCE');
                setSelectedAmphoe(null); 

            } else {
                setSelectedAmphoe({
                    name: name,
                    properties: d.properties
                });
                
                // Reset all paths first
                gPaths.selectAll("path").attr("fill", (feat: GeoJSONFeature, idx: number) => getFillColor(feat, idx)); 
                // Highlight clicked
                d3.select(this).attr("fill", "#DC2626").raise();
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
            .attr("font-weight", viewState === 'PROVINCE' ? "normal" : "bold")
            .attr("fill", "#1F2937")
            .attr("pointer-events", "none")
            .style("text-shadow", "2px 0 #fff, -2px 0 #fff, 0 2px #fff, 0 -2px #fff")
            .style("opacity", 0.9);
        }
    }

  }, [d3Loaded, provinceData, amphoeData, viewState, selectedProvince, showLabels]);

  const handleBack = () => {
      setViewState('COUNTRY');
      setSelectedAmphoe(null);
      setSelectedProvince(null);
  };

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current || !window.d3) return;
    const d3 = window.d3;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, factor);
  };

  const handleRegionClick = (regionKey: string) => {
    if (!provinceData || !svgRef.current || !zoomRef.current || !window.d3) return;
    const d3 = window.d3;
    const width = 800;
    const height = 1200;

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
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-800 relative overflow-hidden">
      
      {/* --- Map Area --- */}
      <div className="absolute inset-0 flex items-center justify-center bg-blue-50 overflow-hidden transition-colors duration-500"
           style={{ backgroundColor: viewState === 'PROVINCE' ? '#f0f9ff' : '#eff6ff' }}>
        
        <div className="absolute inset-0 z-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>

        {/* Loading / Error States */}
        {(loading || loadingAmphoe) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-bold text-blue-800">
                {loading ? "กำลังโหลดแผนที่ประเทศไทย..." : "กำลังโหลดข้อมูลอำเภอ..."}
            </p>
          </div>
        )}

        {errorAmphoe && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-50 p-6 rounded-xl border border-red-200 shadow-xl text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-red-600 mb-4">{errorAmphoe}</p>
                <button 
                    onClick={handleBack}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    กลับไปหน้าหลัก
                </button>
            </div>
        )}

        {/* Map Container */}
        <div className="z-10 relative w-full h-full flex flex-col items-center justify-center">
            
            {/* Header / Back Button */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
                {viewState === 'PROVINCE' ? (
                    <button 
                        onClick={handleBack}
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
                
                <button 
                  onClick={() => setShowLabels(!showLabels)}
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold shadow-md transition-all border border-slate-200 text-slate-700 w-fit"
                >
                  <Type className="w-4 h-4" /> 
                  {showLabels ? "ซ่อนชื่อ" : "แสดงชื่อ"}
                </button>
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
                </div>
            )}
            
            {/* Hover Tooltip */}
            {hoveredFeature && (
               <div className="absolute top-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-lg font-bold z-50 animate-fade-in pointer-events-none transform translate-y-2 border-2 border-slate-600">
                  {hoveredFeature}
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
                {viewState === 'PROVINCE' ? 'ข้อมูลอำเภอ' : 'ข้อมูลจังหวัด'}
            </h1>
            <button onClick={() => { setSelectedProvince(null); setSelectedAmphoe(null); if(viewState === 'PROVINCE') handleBack(); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
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
          ) : viewState === 'PROVINCE' && selectedProvince ? (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span onClick={handleBack} className="cursor-pointer hover:text-blue-600">ประเทศไทย</span>
                    <span>/</span>
                    <span className="font-bold text-slate-800">{selectedProvince.name}</span>
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
                 ) : (
                     <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center py-8">
                         <p className="text-slate-400 mb-2">ยังไม่ได้เลือกอำเภอ</p>
                         <p className="text-sm text-slate-500">คลิกที่พื้นที่ในแผนที่เพื่อดูข้อมูลอำเภอ</p>
                     </div>
                 )}

                 <button 
                    onClick={handleBack}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium mt-auto"
                 >
                    <ChevronLeft className="w-5 h-5" /> กลับไปเลือกจังหวัดอื่น
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
