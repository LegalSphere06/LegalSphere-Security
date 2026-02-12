import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle, Filter, Users, Scale, TrendingUp, Award, MapPinned, ZoomIn, ZoomOut, Maximize2, BarChart3, DollarSign, Briefcase } from 'lucide-react';

const GISDashboard = () => {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [features, setFeatures] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [showLawyers, setShowLawyers] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [analysisMode, setAnalysisMode] = useState('none');
  const [filters, setFilters] = useState({
    district: '',
    specialty: '',
    minFee: 0,
    maxFee: 100000
  });

  const lawyersPerPage = 5;

  const provinceColors = {
    'Western': { base: '#3b82f6', shades: ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'] },
    'Central': { base: '#8b5cf6', shades: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'] },
    'Southern': { base: '#ec4899', shades: ['#f472b6', '#ec4899', '#db2777', '#be185d'] },
    'Northern': { base: '#f97316', shades: ['#fb923c', '#f97316', '#ea580c', '#c2410c'] },
    'Eastern': { base: '#14b8a6', shades: ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'] },
    'North Western': { base: '#eab308', shades: ['#facc15', '#eab308', '#ca8a04', '#a16207'] },
    'North Central': { base: '#84cc16', shades: ['#a3e635', '#84cc16', '#65a30d', '#4d7c0f'] },
    'Uva': { base: '#06b6d4', shades: ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490'] },
    'Sabaragamuwa': { base: '#10b981', shades: ['#34d399', '#10b981', '#059669', '#047857'] }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const queryResponse = await fetch(
          'https://services1.arcgis.com/tMAq108b7itjkui5/ArcGIS/rest/services/SL_DSD_codes/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=102100&f=json'
        );
        const data = await queryResponse.json();
        
        if (data.features && data.features.length > 0) {
          setFeatures(data.features);
          
          // DEBUG: Log district names from GIS
          console.log('GIS Districts:', [...new Set(data.features.map(f => 
            f.attributes.DISTRICT || f.attributes.DISTRICT_N || f.attributes.DIS_NAME
          ))].sort());
          
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          
          data.features.forEach(feature => {
            if (feature.geometry && feature.geometry.rings) {
              feature.geometry.rings.forEach(ring => {
                ring.forEach(([x, y]) => {
                  minX = Math.min(minX, x);
                  maxX = Math.max(maxX, x);
                  minY = Math.min(minY, y);
                  maxY = Math.max(maxY, y);
                });
              });
            }
          });
          
          setMapBounds({ minX, maxX, minY, maxY });
        }

        try {
          const token = localStorage.getItem('aToken');
          const lawyerResponse = await fetch('http://localhost:4000/api/admin/all-lawyers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'atoken': token
            }
          });
          
          const lawyerData = await lawyerResponse.json();
          if (lawyerData.success && lawyerData.lawyers) {
            setLawyers(lawyerData.lawyers);
            
            // DEBUG: Log lawyer districts
            console.log('Lawyer Districts:', [...new Set(lawyerData.lawyers.map(l => l.district))].sort());
          }
        } catch (lawyerError) {
          console.error('Error fetching lawyers:', lawyerError);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load map data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const projectToSVG = (x, y) => {
    if (!mapBounds) return { x: 0, y: 0 };
    
    const svgWidth = 1000;
    const svgHeight = 1400;
    const padding = 40;
    
    const { minX, maxX, minY, maxY } = mapBounds;
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    const dataAspectRatio = dataWidth / dataHeight;
    
    const availableWidth = svgWidth - 2 * padding;
    const availableHeight = svgHeight - 2 * padding;
    const availableAspectRatio = availableWidth / availableHeight;
    
    let scale, offsetX, offsetY;
    
    if (dataAspectRatio > availableAspectRatio) {
      scale = availableWidth / dataWidth;
      offsetX = padding;
      offsetY = padding + (availableHeight - dataHeight * scale) / 2;
    } else {
      scale = availableHeight / dataHeight;
      offsetX = padding + (availableWidth - dataWidth * scale) / 2;
      offsetY = padding;
    }
    
    const svgX = (offsetX + (x - minX) * scale) * zoomLevel + panOffset.x;
    const svgY = (svgHeight - (offsetY + (y - minY) * scale)) * zoomLevel + panOffset.y;
    
    return { x: svgX, y: svgY };
  };

  const latLngToSVG = (lat, lng) => {
    const x = lng * 20037508.34 / 180;
    const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    const mercY = y * 20037508.34 / 180;
    return projectToSVG(x, mercY);
  };

  const generatePath = (rings) => {
    if (!rings || rings.length === 0) return '';
    
    return rings.map(ring => {
      return ring.map(([x, y], idx) => {
        const { x: svgX, y: svgY } = projectToSVG(x, y);
        return `${idx === 0 ? 'M' : 'L'} ${svgX} ${svgY}`;
      }).join(' ') + ' Z';
    }).join(' ');
  };

  // Calculate district-level statistics
  const calculateDistrictStats = () => {
    const districtStats = {};
    
    lawyers.forEach(lawyer => {
      const district = lawyer.district;
      if (!districtStats[district]) {
        districtStats[district] = {
          count: 0,
          totalFees: 0,
          specialties: {},
          lawyers: []
        };
      }
      
      districtStats[district].count++;
      districtStats[district].totalFees += lawyer.fees || 0;
      districtStats[district].specialties[lawyer.speciality] = 
        (districtStats[district].specialties[lawyer.speciality] || 0) + 1;
      districtStats[district].lawyers.push(lawyer);
    });
    
    Object.keys(districtStats).forEach(district => {
      districtStats[district].avgFees = 
        districtStats[district].totalFees / districtStats[district].count;
    });
    
    console.log('District Stats:', districtStats);
    return districtStats;
  };

  const districtStats = calculateDistrictStats();

  const getColorForFeature = (feature) => {
    const attrs = feature.attributes;
    const province = attrs.PROVINCE_N || attrs.PROVINCE || attrs.PRO_NAME || 
                     attrs.Province || attrs.province || attrs.PROV_NAME;
    const dsdCode = attrs.DSD_C || attrs.DSD_CODE || attrs.CODE || 
                    attrs.DSD_N || attrs.DSD_NAME || '';
    
    let provinceScheme = provinceColors['Western'];
    
    if (province) {
      const provinceName = province.toString().trim();
      const matchedProvince = Object.keys(provinceColors).find(key => 
        provinceName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(provinceName.toLowerCase())
      );
      
      if (matchedProvince) {
        provinceScheme = provinceColors[matchedProvince];
      }
    }
    
    const hash = dsdCode.toString().split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const shadeIndex = Math.abs(hash) % provinceScheme.shades.length;
    return provinceScheme.shades[shadeIndex];
  };

  // Get color based on analysis mode
  const getAnalysisColor = (feature) => {
    const attrs = feature.attributes;
    const gisDistrict = attrs.DISTRICT || attrs.DISTRICT_N || attrs.DIS_NAME || '';
    
    // Try to match district names (case-insensitive, partial match)
    let matchedDistrict = null;
    Object.keys(districtStats).forEach(lawyerDist => {
      if (gisDistrict.toLowerCase().includes(lawyerDist.toLowerCase()) ||
          lawyerDist.toLowerCase().includes(gisDistrict.toLowerCase())) {
        matchedDistrict = lawyerDist;
      }
    });
    
    if (analysisMode === 'none') {
      return getColorForFeature(feature);
    }
    
    const stats = matchedDistrict ? districtStats[matchedDistrict] : null;
    
    if (!stats) {
      return '#e5e7eb';
    }
    
    if (analysisMode === 'density') {
      const count = stats.count;
      if (count === 0) return '#fee2e2';
      if (count < 5) return '#fecaca';
      if (count < 10) return '#fca5a5';
      if (count < 20) return '#f87171';
      if (count < 30) return '#ef4444';
      return '#dc2626';
    }
    
    if (analysisMode === 'fees') {
      const avg = stats.avgFees;
      if (avg < 2000) return '#dbeafe';
      if (avg < 3000) return '#bfdbfe';
      if (avg < 4000) return '#93c5fd';
      if (avg < 5000) return '#60a5fa';
      if (avg < 6000) return '#3b82f6';
      return '#2563eb';
    }
    
    if (analysisMode === 'specialty') {
      const specialtyCount = Object.keys(stats.specialties).length;
      if (specialtyCount <= 1) return '#fef3c7';
      if (specialtyCount <= 2) return '#fde68a';
      if (specialtyCount <= 3) return '#fcd34d';
      if (specialtyCount <= 4) return '#fbbf24';
      return '#f59e0b';
    }
    
    if (analysisMode === 'coverage') {
      const count = stats.count;
      if (count === 0) return '#fca5a5';
      if (count < 5) return '#fdba74';
      if (count < 15) return '#fde047';
      if (count < 25) return '#86efac';
      return '#22c55e';
    }
    
    return getColorForFeature(feature);
  };

  const getUniqueDistricts = () => {
    const districts = new Set();
    lawyers.forEach(lawyer => {
      if (lawyer.district) districts.add(lawyer.district);
    });
    return Array.from(districts).sort();
  };

  const getUniqueSpecialties = () => {
    const specialties = new Set();
    lawyers.forEach(lawyer => {
      if (lawyer.speciality) specialties.add(lawyer.speciality);
    });
    return Array.from(specialties).sort();
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    if (filters.district && lawyer.district !== filters.district) return false;
    if (filters.specialty && lawyer.speciality !== filters.specialty) return false;
    if (lawyer.fees < filters.minFee || lawyer.fees > filters.maxFee) return false;
    return true;
  });// Advanced Analytics calculations
  const analytics = {
    totalLawyers: lawyers.length,
    filteredLawyers: filteredLawyers.length,
    averageFees: lawyers.length > 0 ? Math.round(lawyers.reduce((sum, l) => sum + (l.fees || 0), 0) / lawyers.length) : 0,
    medianFees: (() => {
      const fees = lawyers.map(l => l.fees || 0).sort((a, b) => a - b);
      const mid = Math.floor(fees.length / 2);
      return fees.length % 2 === 0 ? (fees[mid - 1] + fees[mid]) / 2 : fees[mid];
    })(),
    feeRange: {
      min: Math.min(...lawyers.map(l => l.fees || 0)),
      max: Math.max(...lawyers.map(l => l.fees || 0))
    },
    topDistrict: lawyers.length > 0 ? Object.entries(
      lawyers.reduce((acc, l) => {
        acc[l.district] = (acc[l.district] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0] : ['N/A', 0],
    specialtyDistribution: lawyers.reduce((acc, l) => {
      acc[l.speciality] = (acc[l.speciality] || 0) + 1;
      return acc;
    }, {}),
    districtDistribution: lawyers.reduce((acc, l) => {
      acc[l.district] = (acc[l.district] || 0) + 1;
      return acc;
    }, {}),
    underservedDistricts: Object.entries(districtStats)
      .filter(([_, stats]) => stats.count < 5)
      .sort((a, b) => a[1].count - b[1].count)
      .slice(0, 5),
    districtFeeVariance: Object.entries(districtStats)
      .map(([district, stats]) => ({
        district,
        avgFee: Math.round(stats.avgFees),
        count: stats.count
      }))
      .sort((a, b) => b.avgFee - a.avgFee)
      .slice(0, 5),
    specialtyDiversity: Object.entries(districtStats)
      .map(([district, stats]) => ({
        district,
        specialtyCount: Object.keys(stats.specialties).length,
        lawyerCount: stats.count
      }))
      .sort((a, b) => b.specialtyCount - a.specialtyCount)
      .slice(0, 5)
  };

  const indexOfLastLawyer = currentPage * lawyersPerPage;
  const indexOfFirstLawyer = indexOfLastLawyer - lawyersPerPage;
  const currentLawyers = filteredLawyers.slice(indexOfFirstLawyer, indexOfLastLawyer);
  const totalPages = Math.ceil(filteredLawyers.length / lawyersPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading GIS Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white -lg shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">Error Loading Map</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 flex overflow-hidden">
      <div className="w-[70%] h-full flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-800">Lawyer GIS Analytics</h1>
                <p className="text-xs text-gray-500">Geographic & Statistical Analysis</p>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {features.length} DSDs | {lawyers.length} Lawyers
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" />
              Analysis Mode
            </h3>
            
            <div className="space-y-1 mb-3">
              <button
                onClick={() => setAnalysisMode('none')}
                className={`w-full text-left px-2 py-1.5 text-xs  transition ${
                  analysisMode === 'none' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                Standard View
              </button>
              <button
                onClick={() => setAnalysisMode('density')}
                className={`w-full text-left px-2 py-1.5 text-xs  transition ${
                  analysisMode === 'density' ? 'bg-red-100 text-red-700 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                Lawyer Density
              </button>
              <button
                onClick={() => setAnalysisMode('fees')}
                className={`w-full text-left px-2 py-1.5 text-xs  transition ${
                  analysisMode === 'fees' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                Fee Distribution
              </button>
              <button
                onClick={() => setAnalysisMode('specialty')}
                className={`w-full text-left px-2 py-1.5 text-xs  transition ${
                  analysisMode === 'specialty' ? 'bg-yellow-100 text-yellow-700 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                Specialty Diversity
              </button>
              <button
                onClick={() => setAnalysisMode('coverage')}
                className={`w-full text-left px-2 py-1.5 text-xs  transition ${
                  analysisMode === 'coverage' ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-gray-100'
                }`}
              >
                Service Coverage
              </button>
            </div>

            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 mt-4 pt-3 border-t">
              <Filter className="w-3 h-3" />
              Filters
            </h3>
            
            <div className="mb-3 p-2 bg-gray-50 ">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLawyers}
                  onChange={(e) => setShowLawyers(e.target.checked)}
                  className="w-3 h-3 text-blue-600"
                />
                <Scale className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium">Show Markers</span>
              </label>
            </div>

            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
              <select
                value={filters.district}
                onChange={(e) => setFilters({...filters, district: e.target.value})}
                className="w-full px-2 py-1.5 text-xs border border-gray-300  focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Districts</option>
                {getUniqueDistricts().map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
              <select
                value={filters.specialty}
                onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                className="w-full px-2 py-1.5 text-xs border border-gray-300  focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Specialties</option>
                {getUniqueSpecialties().map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fee Range (Rs. {filters.minFee} - {filters.maxFee})
              </label>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={filters.maxFee}
                onChange={(e) => setFilters({...filters, maxFee: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>

            <button
              onClick={() => setFilters({ district: '', specialty: '', minFee: 0, maxFee: 100000 })}
              className="w-full px-2 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700  transition mb-3"
            >
              Clear Filters
            </button>

            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Map Controls</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700  flex items-center justify-center gap-1"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700  flex items-center justify-center gap-1"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700  flex items-center justify-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-gray-50">
            <svg
              ref={mapRef}
              viewBox="0 0 1000 1400"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              style={{ background: '#f0f4f8' }}
            >
              <rect width="1000" height="1400" fill="#e5e9f0" />
              
              {features.map((feature, idx) => {
                if (!feature.geometry || !feature.geometry.rings) return null;
                
                const path = generatePath(feature.geometry.rings);
                const color = getAnalysisColor(feature);
                const isSelected = selectedFeature === idx;
                
                return (
                  <g key={idx}>
                    <path
                      d={path}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      opacity={isSelected ? "0.9" : "0.75"}
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedFeature(selectedFeature === idx ? null : idx)}
                    />
                  </g>
                );
              })}

              {showLawyers && filteredLawyers.map((lawyer, idx) => {
                if (!lawyer.latitude || !lawyer.longitude) return null;
                
                const { x, y } = latLngToSVG(lawyer.latitude, lawyer.longitude);
                const isSelected = selectedLawyer?._id === lawyer._id;
                
                return (
                  <g 
                    key={`lawyer-${idx}`} 
                    className="cursor-pointer"
                    onClick={() => setSelectedLawyer(selectedLawyer?._id === lawyer._id ? null : lawyer)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "10" : "8"}
                      fill={isSelected ? "#b91c1c" : "#dc2626"}
                      stroke="#ffffff"
                      strokeWidth="2"
                      opacity="0.9"
                    />
                    <path
                      d={`M ${x} ${y-14} l -5 -9 h 10 z`}
                      fill={isSelected ? "#b91c1c" : "#dc2626"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {analysisMode !== 'none' && (
              <div className="absolute bottom-4 right-4 bg-white p-3 -lg shadow-lg border z-10">
                <h4 className="font-semibold text-xs mb-2">
                  {analysisMode === 'density' && 'Lawyer Density'}
                  {analysisMode === 'fees' && 'Average Fees'}
                  {analysisMode === 'specialty' && 'Specialty Diversity'}
                  {analysisMode === 'coverage' && 'Service Coverage'}
                </h4>
                <div className="space-y-1 text-xs">
                  {analysisMode === 'density' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#dc2626'}}></div>
                        <span>30+ lawyers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#f87171'}}></div>
                        <span>10-20 lawyers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#fecaca'}}></div>
                        <span>&lt;5 lawyers</span>
                      </div>
                    </>
                  )}
                  {analysisMode === 'fees' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#2563eb'}}></div>
                        <span>&gt;Rs.6000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#60a5fa'}}></div>
                        <span>Rs.4000-5000</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#dbeafe'}}></div>
                        <span>&lt;Rs.2000</span>
                      </div>
                    </>
                  )}
                  {analysisMode === 'specialty' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#f59e0b'}}></div>
                        <span>5+ specialties</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#fcd34d'}}></div>
                        <span>2-3 specialties</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#fef3c7'}}></div>
                        <span>1 specialty</span>
                      </div>
                    </>
                  )}
                  {analysisMode === 'coverage' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#22c55e'}}></div>
                        <span>Excellent (25+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#fde047'}}></div>
                        <span>Moderate (5-15)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 " style={{backgroundColor: '#fca5a5'}}></div>
                        <span>Poor (0-5)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedFeature !== null && features[selectedFeature] && (
              <div className="absolute top-4 left-4 bg-white -lg shadow-lg p-3 max-w-xs z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm text-gray-800">DSD Details</h3>
                  <button 
                    onClick={() => setSelectedFeature(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                  {Object.entries(features[selectedFeature].attributes).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-gray-600 font-medium">{key}:</span>
                      <span className="text-gray-800 break-all">{value !== null ? value.toString() : 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLawyer && (
              <div className="absolute top-4 right-4 bg-white -lg shadow-xl p-4 w-72 z-10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-sm text-gray-800">Lawyer Details</h3>
                  <button 
                    onClick={() => setSelectedLawyer(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-3 mb-3">
                  {selectedLawyer.image ? (
                    <img 
                      src={selectedLawyer.image} 
                      alt={selectedLawyer.name}
                      className="w-16 h-16 -lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 -lg bg-gray-200 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800">{selectedLawyer.name}</p>
                    <p className="text-xs text-gray-600">{selectedLawyer.speciality}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-1">Rs. {selectedLawyer.fees}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">District:</span>
                    <span className="text-gray-800 font-medium">{selectedLawyer.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="text-gray-800 font-medium">{selectedLawyer.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-800 font-medium">{selectedLawyer.phone}</span>
                  </div>
                  {selectedLawyer.court1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Court:</span>
                      <span className="text-gray-800 font-medium">{selectedLawyer.court1}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[30%] h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Advanced Analytics
          </h2>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-blue-50 p-2 -lg">
              <p className="text-xl font-bold text-blue-600">{analytics.totalLawyers}</p>
              <p className="text-xs text-gray-600">Total Lawyers</p>
            </div>
            <div className="bg-green-50 p-2 -lg">
              <p className="text-xl font-bold text-green-600">{analytics.filteredLawyers}</p>
              <p className="text-xs text-gray-600">Filtered</p>
            </div>
            <div className="bg-purple-50 p-2 -lg">
              <p className="text-lg font-bold text-purple-600">Rs.{analytics.averageFees}</p>
              <p className="text-xs text-gray-600">Avg. Fees</p>
            </div>
            <div className="bg-orange-50 p-2 -lg">
              <p className="text-lg font-bold text-orange-600">Rs.{Math.round(analytics.medianFees)}</p>
              <p className="text-xs text-gray-600">Median Fees</p>
            </div>
          </div>

          <div className="bg-gray-50 p-2 -lg mb-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Fee Range
            </h4>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Min: Rs.{analytics.feeRange.min}</span>
              <span className="text-gray-600">Max: Rs.{analytics.feeRange.max}</span>
            </div>
          </div>

          <div className="bg-red-50 p-2 -lg mb-2 border border-red-200">
            <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Coverage Gaps
            </h4>
            <div className="space-y-1">
              {analytics.underservedDistricts.slice(0, 3).map(([district, stats]) => (
                <div key={district} className="flex justify-between text-xs">
                  <span className="text-gray-700 truncate">{district}</span>
                  <span className="text-red-600 font-semibold">{stats.count} lawyers</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-2 -lg mb-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Highest Fee Districts
            </h4>
            <div className="space-y-1">
              {analytics.districtFeeVariance.map(({district, avgFee}) => (
                <div key={district} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">{district}</span>
                  <span className="text-gray-800 font-semibold">Rs.{avgFee}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-2 -lg mb-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Specialty Diversity Leaders
            </h4>
            <div className="space-y-1">
              {analytics.specialtyDiversity.map(({district, specialtyCount}) => (
                <div key={district} className="flex justify-between text-xs">
                  <span className="text-gray-600 truncate">{district}</span>
                  <span className="text-gray-800 font-semibold">{specialtyCount} types</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-2 -lg mb-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Top Specialties
            </h4>
            <div className="space-y-1">
              {Object.entries(analytics.specialtyDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([specialty, count]) => (
                  <div key={specialty} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{specialty}</span>
                    <span className="text-gray-800 font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gray-50 p-2 -lg">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <MapPinned className="w-3 h-3" />
              District Distribution
            </h4>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {Object.entries(analytics.districtDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([district, count]) => (
                  <div key={district} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{district}</span>
                    <span className="text-gray-800 font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-700">Lawyers List</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {currentLawyers.length > 0 ? (
              <div className="space-y-2">
                {currentLawyers.map((lawyer) => (
                  <div key={lawyer._id} className="p-2 bg-gray-50 -lg border border-gray-200 hover:bg-gray-100 transition flex gap-2">
                    {lawyer.image ? (
                      <img 
                        src={lawyer.image} 
                        alt={lawyer.name}
                        className="w-12 h-12  object-cover border border-gray-300 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12  bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-gray-800 truncate">{lawyer.name}</p>
                      <p className="text-xs text-gray-600 truncate">{lawyer.speciality}</p>
                      <p className="text-xs text-gray-500">{lawyer.district}</p>
                      <p className="text-xs text-blue-600 font-semibold">Rs. {lawyer.fees}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">No lawyers found</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-2 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed "
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed "
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GISDashboard;