// import React, { useState, useEffect, useRef, useContext } from 'react'
// import { Building, Info, Map, Eye, EyeOff, MapPin, User, Navigation } from 'lucide-react'
// import { AppContext } from '../context/AppContext'

// const CourtsLanka = () => {
//     const { lawyers } = useContext(AppContext)

//     const navigate = (path) => {
//         console.log('Navigate to:', path)
//         alert(`Would navigate to: ${path}`)
//     }

//     const mapRef = useRef(null)
//     const [map, setMap] = useState(null)
//     const [featureLayer, setFeatureLayer] = useState(null)
//     const [labelMarkers, setLabelMarkers] = useState([])
//     const [courtsLayer, setCourtsLayer] = useState(null)
//     const [lawyersLayer, setLawyersLayer] = useState(null)
//     const [userLocationLayer, setUserLocationLayer] = useState(null)
//     const [mapError, setMapError] = useState(false)
//     const [userLocation, setUserLocation] = useState(null)
//     const [nearestLawyer, setNearestLawyer] = useState(null)
//     const [locationError, setLocationError] = useState('')
//     const [isMapLoading, setIsMapLoading] = useState(true)

//     // Filter states
//     const [selectedSpecialty, setSelectedSpecialty] = useState('')
//     const [boundariesVisible, setBoundariesVisible] = useState(true)
//     const [labelsVisible, setLabelsVisible] = useState(true)
//     const [lawyersVisible, setLawyersVisible] = useState(true)

//     // Legal specialties
//     const specialties = [
//         'Corporate Law',
//         'Criminal Law',
//         'Family Law',
//         'Civil Law',
//         'Commercial Law',
//         'Constitutional Law',
//         'Labor Law',
//         'Immigration Law',
//         'Real Estate Law',
//         'Tax Law',
//         'Environmental Law',
//         'Intellectual Property Law'
//     ]

//     // Court filter state
//     const [courtFilters, setCourtFilters] = useState({
//         'Supreme Court': true,
//         'Court of Appeal': true,
//         'High Court': true,
//         'District Court': true,
//         'Magistrate\'s Court': true,
//         'Primary Court': true,
//         'Labour Tribunal': true,
//         'Family Court': true
//     })

//     // Court data - minimal for demonstration (you can add more)
//     const courtsData = [
//         {
//             id: 1,
//             name: 'Supreme Court',
//             type: 'Supreme Court',
//             location: 'Hulftsdorp, Colombo',
//             coordinates: [79.86102, 6.93542],
//             address: 'Supreme Court Complex, Hulftsdorp, Colombo 12',
//             phone: '+94 11 2323456',
//             workingHours: '8:30 AM - 4:30 PM',
//             description: 'The highest court in Sri Lanka, handling constitutional matters and final appeals.'
//         },
//         // Add your other court data here...
//     ]

//     // Get user location
//     const getUserLocation = () => {
//         setLocationError('')
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords
//                     setUserLocation([longitude, latitude])

//                     // Find nearest lawyer
//                     const nearest = findNearestLawyer([longitude, latitude])
//                     setNearestLawyer(nearest)

//                     // Add user location marker to map
//                     if (map) {
//                         addUserLocationMarker([longitude, latitude])
//                         // Center map on user location
//                         map.setView([latitude, longitude], 12)
//                     }
//                 },
//                 (error) => {
//                     setLocationError('Unable to get your location. Please enable location services.')
//                     console.error('Geolocation error:', error)
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 10000,
//                     maximumAge: 600000
//                 }
//             )
//         } else {
//             setLocationError('Geolocation is not supported by this browser.')
//         }
//     }

//     // Calculate distance between two coordinates
//     const calculateDistance = (coord1, coord2) => {
//         const [lon1, lat1] = coord1
//         const [lon2, lat2] = coord2

//         const R = 6371 // Earth's radius in kilometers
//         const dLat = (lat2 - lat1) * Math.PI / 180
//         const dLon = (lon2 - lon1) * Math.PI / 180
//         const a =
//             Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//             Math.sin(dLon / 2) * Math.sin(dLon / 2)
//         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//         return R * c
//     }

//     // Find nearest lawyer
//     const findNearestLawyer = (userCoords) => {
//         if (!lawyers || lawyers.length === 0) return null

//         let filteredLawyers = lawyers

//         // Filter by specialty if selected
//         if (selectedSpecialty) {
//             filteredLawyers = lawyers.filter(lawyer => lawyer.speciality === selectedSpecialty)
//         }

//         if (filteredLawyers.length === 0) return null

//         let nearest = null
//         let minDistance = Infinity

//         filteredLawyers.forEach(lawyer => {
//             if (lawyer.latitude && lawyer.longitude) {
//                 const lawyerCoords = [parseFloat(lawyer.longitude), parseFloat(lawyer.latitude)]
//                 const distance = calculateDistance(userCoords, lawyerCoords)

//                 if (distance < minDistance) {
//                     minDistance = distance
//                     nearest = { ...lawyer, distance: distance.toFixed(2) }
//                 }
//             }
//         })

//         return nearest
//     }

//     // Load Leaflet CSS
//     useEffect(() => {
//         const link = document.createElement('link')
//         link.rel = 'stylesheet'
//         link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
//         document.head.appendChild(link)

//         const esriLeafletCSS = document.createElement('link')
//         esriLeafletCSS.rel = 'stylesheet'
//         esriLeafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/esri-leaflet/3.0.10/esri-leaflet.css'
//         document.head.appendChild(esriLeafletCSS)

//         return () => {
//             document.head.removeChild(link)
//             document.head.removeChild(esriLeafletCSS)
//         }
//     }, [])

//     // Initialize Leaflet Map
//     useEffect(() => {
//         const initializeMap = async () => {
//             try {
//                 setIsMapLoading(true)

//                 // Load Leaflet and Esri-Leaflet
//                 const [L, esriLeaflet] = await Promise.all([
//                     import('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js').then(() => window.L),
//                     import('https://cdnjs.cloudflare.com/ajax/libs/esri-leaflet/3.0.10/esri-leaflet.min.js').then(() => window.L.esri)
//                 ])

//                 // Initialize map
//                 const mapInstance = L.map(mapRef.current).setView([7.8731, 80.7718], 8)

//                 // Add basemap
//                 L.esri.basemapLayer('Streets').addTo(mapInstance)

//                 setMap(mapInstance)

//                 // Create DSD boundaries layer
//                 const dsdLayer = L.esri.featureLayer({
//                     url: 'https://services1.arcgis.com/tMAq108b7itjkui5/ArcGIS/rest/services/SL_DSD_codes/FeatureServer/0',
//                     style: function (feature) {
//                         return {
//                             color: '#2c3e50',
//                             weight: 1,
//                             fillOpacity: 0.7,
//                             fillColor: '#74b9ff'
//                         }
//                     },
//                     onEachFeature: function (feature, layer) {
//                         let popupContent = '<div style="font-family: Arial, sans-serif;"><h4 style="margin: 0 0 10px 0; color: #2c3e50;">DSD Information</h4>'

//                         for (let key in feature.properties) {
//                             if (feature.properties.hasOwnProperty(key) && feature.properties[key] !== null) {
//                                 const displayKey = key.replace(/_/g, ' ').toUpperCase()
//                                 popupContent += `<div style="margin-bottom: 5px;"><strong>${displayKey}:</strong> ${feature.properties[key]}</div>`
//                             }
//                         }

//                         popupContent += '</div>'

//                         layer.bindPopup(popupContent, {
//                             maxWidth: 300,
//                             className: 'custom-popup'
//                         })

//                         layer.on('mouseover', function (e) {
//                             e.target.setStyle({
//                                 weight: 2,
//                                 fillOpacity: 0.9
//                             })
//                         })

//                         layer.on('mouseout', function (e) {
//                             e.target.setStyle({
//                                 weight: 1,
//                                 fillOpacity: 0.7
//                             })
//                         })
//                     }
//                 }).addTo(mapInstance)

//                 setFeatureLayer(dsdLayer)

//                 // Create courts layer
//                 const courtsLayerGroup = L.layerGroup().addTo(mapInstance)
//                 setCourtsLayer(courtsLayerGroup)

//                 // Create lawyers layer
//                 const lawyersLayerGroup = L.layerGroup().addTo(mapInstance)
//                 setLawyersLayer(lawyersLayerGroup)

//                 // Create user location layer
//                 const userLayerGroup = L.layerGroup().addTo(mapInstance)
//                 setUserLocationLayer(userLayerGroup)

//                 // Add court markers
//                 addCourtMarkers(courtsLayerGroup)

//                 // Fit map to layer bounds when loaded
//                 dsdLayer.on('load', function () {
//                     mapInstance.fitBounds(dsdLayer.getBounds())
//                     createDSDLabels(mapInstance, dsdLayer)
//                 })

//                 setIsMapLoading(false)

//             } catch (error) {
//                 console.error('Error initializing map:', error)
//                 setMapError(true)
//                 setIsMapLoading(false)
//             }
//         }

//         if (mapRef.current) {
//             initializeMap()
//         }

//         return () => {
//             if (map) {
//                 map.remove()
//             }
//         }
//     }, [])

//     // Add lawyers to map when data changes
//     useEffect(() => {
//         if (map && lawyersLayer && lawyers.length > 0) {
//             addLawyersToMap()
//         }
//     }, [map, lawyersLayer, lawyers, selectedSpecialty, lawyersVisible])

//     // Update nearest lawyer when user location or filters change
//     useEffect(() => {
//         if (userLocation && lawyers.length > 0) {
//             const nearest = findNearestLawyer(userLocation)
//             setNearestLawyer(nearest)
//         }
//     }, [userLocation, lawyers, selectedSpecialty])

//     // Add user location marker
//     const addUserLocationMarker = (coords) => {
//         if (!map || !userLocationLayer || !window.L) return

//         const L = window.L
//         userLocationLayer.clearLayers()

//         const userIcon = L.divIcon({
//             className: 'user-location-icon',
//             html: `
//                 <div style="
//                     width: 20px;
//                     height: 20px;
//                     background: #3b82f6;
//                     border: 3px solid white;
//                     border-radius: 50%;
//                     box-shadow: 0 2px 10px rgba(0,0,0,0.3);
//                     animation: pulse 2s infinite;
//                 "></div>
//                 <style>
//                     @keyframes pulse {
//                         0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
//                         70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
//                         100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
//                     }
//                 </style>
//             `,
//             iconSize: [20, 20],
//             iconAnchor: [10, 10]
//         })

//         const marker = L.marker([coords[1], coords[0]], { icon: userIcon })
//             .bindPopup(`
//                 <div style="padding: 10px; font-family: Arial, sans-serif;">
//                     <h4 style="margin: 0 0 10px 0; color: #3b82f6;">📍 Your Location</h4>
//                     <p style="margin: 0; color: #666;">Latitude: ${coords[1].toFixed(6)}</p>
//                     <p style="margin: 0; color: #666;">Longitude: ${coords[0].toFixed(6)}</p>
//                 </div>
//             `)

//         userLocationLayer.addLayer(marker)
//     }

//     // Add lawyers to map
//     const addLawyersToMap = () => {
//         if (!map || !lawyersLayer || !window.L) return

//         const L = window.L
//         lawyersLayer.clearLayers()

//         if (!lawyersVisible) return

//         let filteredLawyers = lawyers

//         // Filter by specialty if selected
//         if (selectedSpecialty) {
//             filteredLawyers = lawyers.filter(lawyer => lawyer.speciality === selectedSpecialty)
//         }

//         filteredLawyers.forEach((lawyer) => {
//             if (lawyer.latitude && lawyer.longitude) {
//                 const lawyerIcon = L.divIcon({
//                     className: 'lawyer-marker-icon',
//                     html: `
//                         <div style="
//                             width: 16px;
//                             height: 16px;
//                             background: #e27728;
//                             border: 3px solid white;
//                             border-radius: 50%;
//                             box-shadow: 0 2px 5px rgba(0,0,0,0.3);
//                         "></div>
//                     `,
//                     iconSize: [16, 16],
//                     iconAnchor: [8, 8]
//                 })

//                 const popupContent = `
//                     <div style="padding: 10px; max-width: 300px; font-family: Arial, sans-serif;">
//                         <div style="text-align: center; margin-bottom: 10px;">
//                             <img src="${lawyer.image}" alt="${lawyer.name}"
//                                  style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #e27728;">
//                         </div>
//                         <h4 style="margin: 0 0 8px 0; color: #333; text-align: center;">⚖️ ${lawyer.name}</h4>
//                         <div style="space-y: 5px;">
//                             <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">
//                                 <strong>🏛️ Specialty:</strong> ${lawyer.speciality}
//                             </p>
//                             <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">
//                                 <strong>📍 District:</strong> ${lawyer.district}
//                             </p>
//                             <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">
//                                 <strong>⏱️ Experience:</strong> ${lawyer.experience} years
//                             </p>
//                             <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">
//                                 <strong>💬 Consultation:</strong> ${lawyer.consultationMethod}
//                             </p>
//                             <div style="text-align: center;">
//                                 <span style="
//                                     background: ${lawyer.available ? '#10b981' : '#ef4444'};
//                                     color: white;
//                                     padding: 4px 8px;
//                                     border-radius: 12px;
//                                     font-size: 11px;
//                                     font-weight: bold;
//                                 ">
//                                     ${lawyer.available ? '🟢 Available' : '🔴 Busy'}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 `

//                 const marker = L.marker([parseFloat(lawyer.latitude), parseFloat(lawyer.longitude)], {
//                     icon: lawyerIcon
//                 }).bindPopup(popupContent, {
//                     maxWidth: 320,
//                     className: 'lawyer-popup'
//                 })

//                 // Add click event to navigate to appointment
//                 marker.on('click', () => {
//                     setTimeout(() => {
//                         navigate(`/appointment/${lawyer._id}`)
//                     }, 100)
//                 })

//                 lawyersLayer.addLayer(marker)
//             }
//         })
//     }

//     // Create DSD labels
//     const createDSDLabels = async (mapInstance, dsdLayer) => {
//         try {
//             const L = window.L
//             const markers = []

//             dsdLayer.eachFeature((layer) => {
//                 const feature = layer.feature
//                 const labelText = feature.properties.DSD_N || feature.properties.NAME || feature.properties.DSD_NAME || 'Unknown'

//                 const bounds = layer.getBounds()
//                 const center = bounds.getCenter()

//                 const labelMarker = L.marker(center, {
//                     icon: L.divIcon({
//                         className: 'label-icon',
//                         html: `<div style="background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 3px; font-size: 10px; font-weight: bold; text-align: center; border: 1px solid #ccc;">${labelText}</div>`,
//                         iconSize: [100, 20],
//                         iconAnchor: [50, 10]
//                     })
//                 })

//                 labelMarker.addTo(mapInstance)
//                 markers.push(labelMarker)
//             })

//             setLabelMarkers(markers)
//         } catch (error) {
//             console.error('Error creating labels:', error)
//         }
//     }

//     // Create court icon SVG
//     const createCourtIcon = (color) => {
//         const svg = `
//             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M12 2L2 7V9H22V7L12 2Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M4 9V19H6V9H4Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M8 9V19H10V9H8Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M12 9V19H14V9H12Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M16 9V19H18V9H16Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M20 9V19H22V9H20Z" fill="${color}" stroke="white" stroke-width="1"/>
//                 <path d="M2 19H22V21H2V19Z" fill="${color}" stroke="white" stroke-width="1"/>
//             </svg>
//         `
//         return 'data:image/svg+xml;base64,' + btoa(svg)
//     }

//     // Add court markers
//     const addCourtMarkers = (layerGroup) => {
//         if (!window.L || !layerGroup) return

//         const L = window.L
//         layerGroup.clearLayers()

//         const filteredCourts = courtsData.filter(court => courtFilters[court.type])

//         filteredCourts.forEach(court => {
//             const courtNearestLawyer = userLocation ? findNearestLawyer(court.coordinates) : null

//             const popupContent = `
//             <div style="padding: 10px; max-width: 350px; font-family: Arial, sans-serif;">
//                 <div style="border-bottom: 2px solid ${getCourtColor(court.type)}; padding-bottom: 10px; margin-bottom: 15px;">
//                     <h3 style="margin: 0 0 5px 0; color: #333; font-size: 16px; font-weight: bold;">${court.name}</h3>
//                     <span style="background: ${getCourtColor(court.type)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
//                         ${court.type}
//                     </span>
//                 </div>

//                 <div style="margin-bottom: 15px;">
//                     <p style="margin: 0 0 8px 0; color: #666; font-size: 13px; line-height: 1.4;">
//                         <strong>📍 Address:</strong><br>${court.address}
//                     </p>
//                     <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">
//                         <strong>📞 Phone:</strong> ${court.phone}
//                     </p>
//                     <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">
//                         <strong>🕐 Hours:</strong> ${court.workingHours}
//                     </p>
//                     <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.4;">
//                         <strong>ℹ️ Description:</strong><br>${court.description}
//                     </p>
//                 </div>

//                 ${courtNearestLawyer ? `
//                     <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 15px; border-radius: 12px; color: white; position: relative;">
//                         <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #f3f4f6;">⚖️ Nearest Lawyer</h4>
//                         <div style="display: flex; align-items: center; gap: 12px;">
//                             <div style="position: relative;">
//                                 <img src="${courtNearestLawyer.image}" alt="${courtNearestLawyer.name}"
//                                      style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2);">
//                                 <div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px;
//                                            background: ${courtNearestLawyer.available ? '#10b981' : '#ef4444'};
//                                            border-radius: 50%; border: 2px solid #1f2937;"></div>
//                             </div>
//                             <div style="flex: 1;">
//                                 <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 13px; color: white;">
//                                     ${courtNearestLawyer.name}
//                                 </p>
//                                 <p style="margin: 0 0 2px 0; font-size: 12px; color: #d1d5db;">
//                                     ${courtNearestLawyer.speciality}
//                                 </p>
//                                 <p style="margin: 0; font-size: 11px; color: #9ca3af;">
//                                     ${courtNearestLawyer.district} • ${courtNearestLawyer.distance} km away
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 ` : ''}
//             </div>
//         `

//             const marker = L.marker([court.coordinates[1], court.coordinates[0]], {
//                 icon: L.icon({
//                     iconUrl: createCourtIcon(getCourtColor(court.type)),
//                     iconSize: [32, 32],
//                     iconAnchor: [16, 32],
//                     popupAnchor: [0, -32]
//                 })
//             }).bindPopup(popupContent, {
//                 maxWidth: 400,
//                 className: 'court-popup'
//             })

//             layerGroup.addLayer(marker)
//         })
//     }

//     // Get color based on court type
//     const getCourtColor = (type) => {
//         const colors = {
//             'Supreme Court': '#8B0000',
//             'Court of Appeal': '#B22222',
//             'High Court': '#DC143C',
//             'District Court': '#FF4500',
//             'Magistrate\'s Court': '#FF6347',
//             'Primary Court': '#FF7F50',
//             'Labour Tribunal': '#4682B4',
//             'Family Court': '#9370DB'
//         }
//         return colors[type] || '#666666'
//     }

//     // Handle filter changes
//     const handleFilterChange = (courtType) => {
//         const newFilters = {
//             ...courtFilters,
//             [courtType]: !courtFilters[courtType]
//         }
//         setCourtFilters(newFilters)

//         if (courtsLayer) {
//             addCourtMarkers(courtsLayer)
//         }
//     }

//     // Handle specialty filter change
//     const handleSpecialtyChange = (specialty) => {
//         setSelectedSpecialty(specialty)

//         // Update nearest lawyer based on new specialty filter
//         if (userLocation) {
//             const nearest = findNearestLawyer(userLocation)
//             setNearestLawyer(nearest)
//         }
//     }

//     // Clear specialty filter
//     const clearSpecialtyFilter = () => {
//         setSelectedSpecialty('')

//         // Update nearest lawyer
//         if (userLocation) {
//             const nearest = findNearestLawyer(userLocation)
//             setNearestLawyer(nearest)
//         }
//     }

//     // Handle DSD boundaries toggle
//     const toggleBoundaries = () => {
//         if (!map || !featureLayer) return

//         if (boundariesVisible) {
//             map.removeLayer(featureLayer)
//         } else {
//             map.addLayer(featureLayer)
//         }
//         setBoundariesVisible(!boundariesVisible)
//     }

//     // Handle DSD labels toggle
//     const toggleLabels = () => {
//         if (!map) return

//         if (labelsVisible) {
//             labelMarkers.forEach(marker => {
//                 map.removeLayer(marker)
//             })
//         } else {
//             labelMarkers.forEach(marker => {
//                 map.addLayer(marker)
//             })
//         }
//         setLabelsVisible(!labelsVisible)
//     }

//     // Handle lawyers visibility toggle
//     const toggleLawyers = () => {
//         setLawyersVisible(!lawyersVisible)

//         if (lawyersLayer) {
//             if (lawyersVisible) {
//                 lawyersLayer.clearLayers()
//             } else {
//                 addLawyersToMap()
//             }
//         }
//     }

//     return (
//         <div className="min-h-screen bg-[#D8D8E3]">
//             <div className="max-w-7xl mx-auto">
//                 {/* Header */}
//                 <div className='text-left text-2xl text-gray-500 mb-[5px] pt-5 pb-5'>
//                     <p>Explore <span className='text-gray-700 font-medium'>Courts Lanka</span></p>
//                 </div>

//                 {/* Filters Section */}
//                 <div className="border border-gray-200 rounded-2xl px-4 py-2 mb-6 shadow-sm">
//                     <div className="flex flex-wrap gap-4 items-end">
//                         {/* Specialty Filter */}
//                         <div className="flex-1 min-w-[200px]">
//                             <label className="block text-xs font-medium text-gray-600 mb-1">
//                                 Legal Specialty
//                             </label>
//                             <select
//                                 value={selectedSpecialty}
//                                 onChange={(e) => handleSpecialtyChange(e.target.value)}
//                                 className="w-full px-4 py-1 text-sm text-gray-700 border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none"
//                                 style={{ backgroundColor: '#D8D8E3' }}
//                             >
//                                 <option value="">All Specialties</option>
//                                 {specialties.map((spec) => (
//                                     <option key={spec} value={spec}>{spec}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Get Location Button */}
//                         <div className="flex items-end">
//                             <button
//                                 onClick={getUserLocation}
//                                 className="px-4 py-1 text-sm bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded-full hover:shadow-lg transition-all flex items-center gap-2"
//                             >
//                                 <MapPin className="w-4 h-4" />
//                                 My Location
//                             </button>
//                         </div>

//                         {/* Clear Filters Button */}
//                         <div className="flex items-end">
//                             <button
//                                 onClick={clearSpecialtyFilter}
//                                 className="px-4 py-1 text-sm text-[#6A0610] border border-[#6A0610] rounded-full hover:bg-[#6A0610] hover:text-white transition-all"
//                             >
//                                 Clear
//                             </button>
//                         </div>
//                     </div>

//                     {/* Location Error */}
//                     {locationError && (
//                         <div className="mt-2 text-red-600 text-sm">
//                             {locationError}
//                         </div>
//                     )}
//                 </div>

//                 {/* Main Content Area */}
//                 <div className='flex flex-col lg:flex-row gap-1'>
//                     {/* Map Section */}
//                     <div className='lg:w-2/3'>
//                         <div className='bg-white shadow-lg overflow-hidden border border-gray-200'>
//                             <div className='bg-[#030303] text-white p-4'>
//                                 <h2 className='text-xl font-bold flex items-center gap-2'>
//                                     <Building className="w-5 h-5" />
//                                     Courts & Lawyers Map
//                                     {userLocation && <span className='text-blue-200'>- Your Location Detected</span>}
//                                 </h2>
//                                 <p className='text-blue-100 text-sm mt-1'>Click on courts, boundaries, or lawyer markers to explore</p>
//                             </div>

//                             <div className='relative h-[500px] lg:h-[700px]'>
//                                 {isMapLoading && (
//                                     <div className='absolute inset-0 bg-gray-100 flex items-center justify-center z-10'>
//                                         <div className='text-center'>
//                                             <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
//                                             <p className='text-gray-600 font-medium'>Loading Map...</p>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {mapError ? (
//                                     <div className="w-full h-full flex items-center justify-center bg-gray-100">
//                                         <div className="text-center">
//                                             <p className="text-gray-500 mb-2">Unable to load map</p>
//                                             <p className="text-sm text-gray-400">Please check your internet connection</p>
//                                         </div>
//                                     </div>
//                                 ) : (
//                                     <div
//                                         ref={mapRef}
//                                         className="w-full h-full"
//                                     />
//                                 )}
//                             </div>

//                             <div className='bg-gray-50 p-4 border-t'>
//                                 <div className='flex items-center justify-between text-sm text-gray-600'>
//                                     <span>🏛️ Showing {courtsData.filter(court => courtFilters[court.type]).length} courts</span>
//                                     <span>⚖️ {lawyers.filter(lawyer => selectedSpecialty ? lawyer.speciality === selectedSpecialty : true).length} lawyers available</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Sidebar Controls */}
//                     <div className='lg:w-1/3 space-y-4'>
//                         {/* User Location & Nearest Lawyer Card */}
//                         {userLocation && (
//                             <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
//                                 <div className="bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white p-3 rounded-xl mb-4">
//                                     <h3 className="text-lg font-bold flex items-center gap-2">
//                                         <MapPin className="w-5 h-5" />
//                                         Your Location
//                                     </h3>
//                                     <p className="text-blue-100 text-sm">
//                                         Lat: {userLocation[1].toFixed(6)}, Lng: {userLocation[0].toFixed(6)}
//                                     </p>
//                                 </div>

//                                 {nearestLawyer && (
//                                     <div className="bg-[#030303] rounded-xl p-3">
//                                         <h4 className="text-white text-sm font-bold mb-3 flex items-center gap-2">
//                                             <User className="w-4 h-4" />
//                                             Nearest Lawyer {selectedSpecialty && `(${selectedSpecialty})`}
//                                         </h4>

//                                         <div className="flex items-center gap-3 mb-3">
//                                             <div className="relative">
//                                                 <img
//                                                     src={nearestLawyer.image}
//                                                     alt={nearestLawyer.name}
//                                                     className="w-12 h-12 rounded-full object-cover"
//                                                 />
//                                                 <div className={`absolute top-0 right-0 w-3 h-3 ${nearestLawyer.available ? 'bg-green-500' : 'bg-red-500'} rounded-full border-2 border-[#030303]`}></div>
//                                             </div>
//                                             <div className="flex-1">
//                                                 <h5 className="text-white text-sm font-bold">{nearestLawyer.name}</h5>
//                                                 <p className="text-gray-300 text-xs">{nearestLawyer.speciality}</p>
//                                                 <p className="text-gray-400 text-xs">{nearestLawyer.district} • {nearestLawyer.distance} km away</p>
//                                             </div>
//                                         </div>

//                                         <button
//                                             onClick={() => navigate(`/appointment/${nearestLawyer._id}`)}
//                                             className="w-full py-2 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
//                                             style={{
//                                                 background: 'linear-gradient(to right, #6A0610, #D00C1F)',
//                                             }}
//                                         >
//                                             Book Appointment
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {/* Map Controls */}
//                         <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
//                             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
//                                 <Map className="w-5 h-5" />
//                                 Map Controls
//                             </h3>
//                             <div className="space-y-3">
//                                 <button
//                                     onClick={toggleBoundaries}
//                                     className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${boundariesVisible
//                                             ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
//                                             : 'bg-gray-50 border-2 border-gray-200 text-gray-600'
//                                         }`}
//                                 >
//                                     <span className="flex items-center gap-2">
//                                         {boundariesVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
//                                         DSD Boundaries
//                                     </span>
//                                 </button>

//                                 <button
//                                     onClick={toggleLabels}
//                                     className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${labelsVisible
//                                             ? 'bg-blue-50 border-2 border-blue-200 text-blue-800'
//                                             : 'bg-gray-50 border-2 border-gray-200 text-gray-600'
//                                         }`}
//                                 >
//                                     <span className="flex items-center gap-2">
//                                         {labelsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
//                                         DSD Labels
//                                     </span>
//                                 </button>

//                                 <button
//                                     onClick={toggleLawyers}
//                                     className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${lawyersVisible
//                                             ? 'bg-orange-50 border-2 border-orange-200 text-orange-800'
//                                             : 'bg-gray-50 border-2 border-gray-200 text-gray-600'
//                                         }`}
//                                 >
//                                     <span className="flex items-center gap-2">
//                                         {lawyersVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
//                                         Lawyers
//                                     </span>
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Court Type Filters */}
//                         <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
//                             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
//                                 <Building className="w-5 h-5" />
//                                 Court Types
//                             </h3>
//                             <div className="space-y-3">
//                                 {Object.keys(courtFilters).map(courtType => (
//                                     <label key={courtType} className="flex items-center gap-3 cursor-pointer group">
//                                         <input
//                                             type="checkbox"
//                                             checked={courtFilters[courtType]}
//                                             onChange={() => handleFilterChange(courtType)}
//                                             className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
//                                         />
//                                         <span
//                                             className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
//                                             style={{ backgroundColor: getCourtColor(courtType) }}
//                                         />
//                                         <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
//                                             {courtType}
//                                         </span>
//                                     </label>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Available Lawyers List */}
//                         {selectedSpecialty && (
//                             <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
//                                 <div className="bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white p-3 rounded-xl mb-4">
//                                     <h3 className="text-lg font-bold">
//                                         {selectedSpecialty} Lawyers
//                                     </h3>
//                                     <p className="text-blue-100 text-sm">
//                                         {lawyers.filter(lawyer => lawyer.speciality === selectedSpecialty).length} specialists found
//                                     </p>
//                                 </div>

//                                 <div className="max-h-64 overflow-y-auto space-y-2">
//                                     {lawyers
//                                         .filter(lawyer => lawyer.speciality === selectedSpecialty)
//                                         .slice(0, 5)
//                                         .map((lawyer) => (
//                                             <div
//                                                 key={lawyer._id}
//                                                 onClick={() => navigate(`/appointment/${lawyer._id}`)}
//                                                 className="bg-[#030303] rounded-lg p-2 cursor-pointer hover:bg-gray-800 transition-colors"
//                                             >
//                                                 <div className="flex items-center gap-2">
//                                                     <img
//                                                         src={lawyer.image}
//                                                         alt={lawyer.name}
//                                                         className="w-8 h-8 rounded-full object-cover"
//                                                     />
//                                                     <div className="flex-1">
//                                                         <h6 className="text-white text-sm font-bold">{lawyer.name}</h6>
//                                                         <p className="text-gray-300 text-xs">{lawyer.district} • {lawyer.experience} yrs</p>
//                                                     </div>
//                                                     <div className={`w-2 h-2 ${lawyer.available ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* Instructions */}
//                 <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
//                     <div className="flex items-start gap-3">
//                         <div className="flex-shrink-0">
//                             <Info className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div>
//                             <h4 className="text-blue-900 font-medium mb-1">Map Features</h4>
//                             <ul className="text-blue-700 text-sm space-y-1">
//                                 <li>• Click "My Location" to see your current position and find nearest lawyers</li>
//                                 <li>• Use specialty filter to find lawyers by legal expertise</li>
//                                 <li>• Click on court markers to view detailed information and nearest lawyers</li>
//                                 <li>• Click on DSD boundaries to view administrative division details</li>
//                                 <li>• Toggle map layers using the sidebar controls</li>
//                                 <li>• Click on lawyer markers to book appointments</li>
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default CourtsLanka
