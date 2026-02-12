import React, { useState, useEffect, useContext } from 'react'
import { MapPin, User, Navigation, Maximize2, Minimize2, Route, X } from 'lucide-react'
import { AppContext } from '../context/AppContext'

const NearestLawyer = () => {
    const { lawyers } = useContext(AppContext)

    const navigate = (path) => {
        console.log('Navigate to:', path)
        alert(`Would navigate to: ${path}`)
    }

    const [userLocation, setUserLocation] = useState(null)
    const [nearestLawyers, setNearestLawyers] = useState([])
    const [locationError, setLocationError] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('')
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [isMapExpanded, setIsMapExpanded] = useState(false)
    const [mapView, setMapView] = useState(null)
    const [showDirections, setShowDirections] = useState(false)
    const [routeInfo, setRouteInfo] = useState(null)
    const [selectedLawyerForDirections, setSelectedLawyerForDirections] = useState(null)

    const specialties = [
        'Corporate Law', 'Criminal Law', 'Family Law', 'Civil Law', 'Commercial Law',
        'Constitutional Law', 'Labor Law', 'Immigration Law', 'Real Estate Law',
        'Tax Law', 'Environmental Law', 'Intellectual Property Law'
    ]

    const getUserLocation = () => {
        setLocationError('')
        setIsGettingLocation(true)

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setUserLocation([longitude, latitude])
                    setIsGettingLocation(false)
                },
                (error) => {
                    setLocationError('Unable to get your location. Please enable location services.')
                    setIsGettingLocation(false)
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
            )
        } else {
            setLocationError('Geolocation is not supported by this browser.')
            setIsGettingLocation(false)
        }
    }

    const calculateDistance = (coord1, coord2) => {
        const [lon1, lat1] = coord1
        const [lon2, lat2] = coord2
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const findNearestLawyers = (userCoords) => {
        if (!lawyers || lawyers.length === 0) return []

        let filteredLawyers = selectedSpecialty
            ? lawyers.filter(lawyer => lawyer.speciality === selectedSpecialty)
            : lawyers

        return filteredLawyers
            .filter(lawyer => lawyer.latitude && lawyer.longitude)
            .map(lawyer => {
                const lawyerCoords = [parseFloat(lawyer.longitude), parseFloat(lawyer.latitude)]
                const distance = calculateDistance(userCoords, lawyerCoords)
                return { ...lawyer, distance: distance.toFixed(1) }
            })
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
            .slice(0, 10)
    }

    const toggleMapSize = () => {
        setIsMapExpanded(!isMapExpanded)
        // Resize map after toggle
        setTimeout(() => {
            if (mapView) {
                mapView.resize()
            }
        }, 100)
    }

    const showDirectionsToLawyer = (lawyer) => {
        setSelectedLawyerForDirections(lawyer)
        setShowDirections(true)

        // Calculate estimated travel time (rough estimate: 2 minutes per km)
        const estimatedTime = Math.ceil(parseFloat(lawyer.distance) * 2)
        setRouteInfo({
            distance: lawyer.distance,
            estimatedTime: estimatedTime,
            destination: lawyer.name,
            destinationDistrict: lawyer.district
        })

        // If map view exists, center on route
        if (mapView) {
            const centerLat = (userLocation[1] + parseFloat(lawyer.latitude)) / 2
            const centerLon = (userLocation[0] + parseFloat(lawyer.longitude)) / 2
            mapView.goTo({
                center: [centerLon, centerLat],
                zoom: 11
            })
        }
    }

    const hideDirections = () => {
        setShowDirections(false)
        setRouteInfo(null)
        setSelectedLawyerForDirections(null)

        // Reset map view to original position
        if (mapView && userLocation) {
            mapView.goTo({
                center: userLocation,
                zoom: 12
            })
        }
    }

    useEffect(() => {
        if (userLocation && lawyers.length > 0) {
            setNearestLawyers(findNearestLawyers(userLocation))
        }
    }, [userLocation, lawyers, selectedSpecialty])

    useEffect(() => {
        if (userLocation && nearestLawyers.length > 0) {
            // Initialize ArcGIS map
            const script = document.createElement('script')
            script.src = 'https://js.arcgis.com/4.28/init.js'
            script.onload = () => {
                require([
                    'esri/Map',
                    'esri/views/MapView',
                    'esri/Graphic',
                    'esri/geometry/Point',
                    'esri/geometry/Circle',
                    'esri/geometry/Polyline',
                    'esri/symbols/SimpleMarkerSymbol',
                    'esri/symbols/PictureMarkerSymbol',
                    'esri/symbols/SimpleFillSymbol',
                    'esri/symbols/SimpleLineSymbol',
                    'esri/PopupTemplate'
                ], (Map, MapView, Graphic, Point, Circle, Polyline, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, PopupTemplate) => {
                    const map = new Map({
                        basemap: 'streets-navigation-vector'
                    })

                    const view = new MapView({
                        container: 'arcgis-map',
                        map: map,
                        center: userLocation,
                        zoom: 12
                    })

                    setMapView(view)

                    // Create buffer around user location (5km radius)
                    const bufferGeometry = new Circle({
                        center: new Point({
                            longitude: userLocation[0],
                            latitude: userLocation[1]
                        }),
                        radius: 5,
                        radiusUnit: "kilometers"
                    })

                    const bufferGraphic = new Graphic({
                        geometry: bufferGeometry,
                        symbol: new SimpleFillSymbol({
                            color: [255, 255, 0, 0.2], // Light yellow with transparency
                            outline: {
                                color: [255, 255, 0, 0.6],
                                width: 2
                            }
                        })
                    })

                    view.graphics.add(bufferGraphic)

                    // Create custom user location icon
                    const userMarker = new Graphic({
                        geometry: new Point({
                            longitude: userLocation[0],
                            latitude: userLocation[1]
                        }),
                        symbol: new PictureMarkerSymbol({
                            url: "data:image/svg+xml;base64," + btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007BFF" stroke="white" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                                    <circle cx="12" cy="6" r="2" fill="white"/>
                                </svg>
                            `),
                            width: "28px",
                            height: "28px"
                        }),
                        popupTemplate: new PopupTemplate({
                            title: "Your Location",
                            content: "You are here"
                        })
                    })

                    view.graphics.add(userMarker)

                    // Add lawyer markers with custom icons and click handlers
                    nearestLawyers.forEach((lawyer, index) => {
                        const isNearest = index === 0
                        const iconColor = isNearest ? "#6A0610" : "#D00C1F"

                        const lawyerMarker = new Graphic({
                            geometry: new Point({
                                longitude: parseFloat(lawyer.longitude),
                                latitude: parseFloat(lawyer.latitude)
                            }),
                            symbol: new PictureMarkerSymbol({
                                url: "data:image/svg+xml;base64," + btoa(`
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColor}" stroke="white" stroke-width="1">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                                        ${isNearest ? '<circle cx="12" cy="12" r="2" fill="white"/>' : ''}
                                    </svg>
                                `),
                                width: isNearest ? "32px" : "24px",
                                height: isNearest ? "32px" : "24px"
                            }),
                            popupTemplate: new PopupTemplate({
                                title: `${isNearest ? '🎯 ' : ''}${lawyer.name}`,
                                content: `
                                    <div style="font-family: Arial, sans-serif;">
                                        ${isNearest ? '<div style="color: #6A0610; font-weight: bold; margin-bottom: 8px;">⭐ NEAREST LAWYER</div>' : ''}
                                        <p><strong>Specialty:</strong> ${lawyer.speciality}</p>
                                        <p><strong>Experience:</strong> ${lawyer.experience} years</p>
                                        <p><strong>Distance:</strong> ${lawyer.distance} km</p>
                                        <p><strong>Available:</strong> ${lawyer.available ? '✅ Yes' : '❌ No'}</p>
                                        <p><strong>District:</strong> ${lawyer.district}</p>
                                        <p><strong>Method:</strong> ${lawyer.consultationMethod}</p>
                                    </div>
                                `
                            })
                        })

                        view.graphics.add(lawyerMarker)
                    })
                })
            }
            document.head.appendChild(script)

            // Load ArcGIS CSS
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://js.arcgis.com/4.28/esri/themes/light/main.css'
            document.head.appendChild(link)
        }
    }, [userLocation, nearestLawyers])

    return (
        <div className="min-h-screen py-6">
            <div className='flex flex-col items-center gap-4 py-5 text-gray-800' id='speciality'>
                <h1 className='text-3xl font-medium'>Find Your Nearest Lawyer</h1>
                <p className='sm:w-1/3 text-center text-sm'>Are you In a rush? Simply Click the "My Location" button and filter and get your nearest lawyer</p>
            </div>
            <div className="max-w-7xl mx-auto px-4">

                {/* Filters */}
                <div className="border border-gray-200 rounded-2xl px-4 py-2 mb-4 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none"
                                style={{ backgroundColor: '#D8D8E3' }}
                            >
                                <option value="">All Specialties</option>
                                {specialties.map((spec) => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={getUserLocation}
                            disabled={isGettingLocation}
                            className="px-4 py-1.5 text-sm bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded-full hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <MapPin className="w-4 h-4" />
                            {isGettingLocation ? 'Getting...' : 'My Location'}
                        </button>
                        {selectedSpecialty && (
                            <button
                                onClick={() => setSelectedSpecialty('')}
                                className="px-3 py-1.5 text-sm text-[#6A0610] border border-[#6A0610] rounded-full hover:bg-[#6A0610] hover:text-white transition-all"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    {locationError && (
                        <div className="mt-2 text-red-600 text-sm">{locationError}</div>
                    )}
                </div>

                {/* Lawyers Layout - Left Recommended, Right Grid */}
                {userLocation && nearestLawyers.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-80 mb-4">
                        {/* Recommended Lawyer - Left Side (3 columns) */}
                        <div className="lg:col-span-3">
                            <div className="border border-gray-200 rounded-xl p-3 h-full shadow-sm">
                                <div className="flex gap-4 h-full">
                                    {/* Image Section */}
                                    <div className="flex-shrink-0 relative">
                                        <img
                                            className='w-48 h-full object-cover rounded-lg'
                                            src={nearestLawyers[0].image}
                                            alt={nearestLawyers[0].name}
                                        />
                                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg ${nearestLawyers[0].available ? 'bg-green-500' : 'bg-red-500'}`}>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full"></div>
                                                {nearestLawyers[0].available ? 'Available' : 'Busy'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-gray-900 text-xl font-bold mb-1">Recommended</h3>
                                            <h4 className="text-gray-800 text-lg font-semibold mb-2">{nearestLawyers[0].name}</h4>
                                            <p className="text-[#6A0610] text-sm font-medium mb-3">{nearestLawyers[0].speciality}</p>

                                            <div className='space-y-2'>
                                                <div className='flex items-center justify-between text-sm'>
                                                    <span className='text-gray-700'>Experience</span>
                                                    <span className='font-semibold text-gray-900'>{nearestLawyers[0].experience} Years</span>
                                                </div>
                                                <div className='flex items-center justify-between text-sm'>
                                                    <span className='text-gray-700'>Location</span>
                                                    <span className='font-semibold text-gray-900'>{nearestLawyers[0].district}</span>
                                                </div>
                                                <div className='flex items-center justify-between text-sm'>
                                                    <span className='text-gray-700'>Distance</span>
                                                    <span className='font-semibold text-gray-900'>{nearestLawyers[0].distance} km</span>
                                                </div>
                                                <div className='flex items-center justify-between text-sm'>
                                                    <span className='text-gray-700'>Method</span>
                                                    <span className='font-semibold text-gray-900'>{nearestLawyers[0].consultationMethod}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => navigate(`/appointment/${nearestLawyers[0]._id}`)}
                                                className="flex-1 py-2 bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                                            >
                                                Book Appointment
                                            </button>
                                            <button
                                                onClick={() => showDirectionsToLawyer(nearestLawyers[0])}
                                                className="px-3 py-2 bg-white border border-[#6A0610] text-[#6A0610] rounded-lg hover:bg-[#6A0610] hover:text-white transition-all duration-200"
                                                title="Get Directions"
                                            >
                                                <Navigation className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Other Lawyers - Right Side (2 columns) */}
                        {nearestLawyers.length > 1 && (
                            <div className="lg:col-span-2">
                                <div className="border border-gray-200 rounded-xl p-3 h-full shadow-sm">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Other Nearby</h3>
                                    <div className="h-64 flex flex-col gap-2">
                                        {/* Only 2 lawyers */}
                                        <div className="grid grid-cols-2 gap-2 flex-1">
                                            {nearestLawyers.slice(1, 3).map((item, index) => (
                                                <div
                                                    key={item._id}
                                                    className='bg-gradient-to-br from-black to-[#030303] rounded-lg p-2 cursor-pointer hover:translate-y-[-2px] transition-all duration-300 shadow-md hover:shadow-lg h-full flex flex-col relative'
                                                >
                                                    {/* Profile Image with Availability Badge */}
                                                    <div className="flex justify-center mb-1 relative">
                                                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-300">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        {/* Availability Badge */}
                                                        <div className="absolute top-[-2px] left-[-2px] flex items-center gap-1 bg-gray-700 bg-opacity-80 px-1 py-1 rounded-full">
                                                            <div className={`w-1 h-1 ${item.available ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
                                                        </div>
                                                    </div>

                                                    {/* Name */}
                                                    <h2 className="text-white text-xs font-medium text-center mb-1 leading-tight truncate">
                                                        {item.name}
                                                    </h2>

                                                    {/* Specialized Area */}
                                                    <p className="text-gray-300 text-xs text-center mb-1 truncate">
                                                        {item.speciality}
                                                    </p>

                                                    {/* District and Distance */}
                                                    <p className="text-gray-400 text-xs text-center mb-2 truncate">
                                                        {item.distance} km
                                                    </p>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-1 mt-auto">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/appointment/${item._id}`);
                                                                scroll(0, 0);
                                                            }}
                                                            className="flex-1 h-7 bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded text-xs font-medium transition-all hover:shadow-md"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                showDirectionsToLawyer(item);
                                                            }}
                                                            className="h-7 px-2 bg-white bg-opacity-20 text-white rounded text-xs transition-all hover:bg-opacity-30"
                                                            title="Get Directions"
                                                        >
                                                            <Navigation className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Enhanced ArcGIS Map with Controls */}
                {userLocation && nearestLawyers.length > 0 && (
                    <div className={`border border-gray-200 rounded-xl shadow-sm transition-all duration-300 relative ${isMapExpanded
                        ? 'fixed inset-4 z-50 bg-white'
                        : 'h-96'
                        }`}>
                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <button
                                onClick={() => showDirectionsToLawyer(nearestLawyers[0])}
                                className={`p-2 rounded-lg shadow-lg transition-all ${showDirections
                                    ? 'bg-[#6A0610] text-white'
                                    : 'bg-white text-[#6A0610] hover:bg-gray-50'
                                    }`}
                                title="Show Directions to Nearest Lawyer"
                            >
                                <Navigation className="w-5 h-5" />
                            </button>
                            <button
                                onClick={toggleMapSize}
                                className="p-2 bg-white text-[#6A0610] rounded-lg shadow-lg hover:bg-gray-50 transition-all"
                                title={isMapExpanded ? "Minimize Map" : "Expand Map"}
                            >
                                {isMapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Map Legend */}
                        <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Map Legend</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                    <span>Your Location</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-[#6A0610] rounded-full"></div>
                                    <span>Nearest Lawyer</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-[#D00C1F] rounded-full"></div>
                                    <span>Other Lawyers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-yellow-300 rounded-full opacity-50"></div>
                                    <span>5km Buffer Zone</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Directions Panel */}
                        {showDirections && routeInfo && selectedLawyerForDirections && (
                            <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <Route className="w-4 h-4 text-[#6A0610]" />
                                        Directions
                                    </h4>
                                    <button
                                        onClick={hideDirections}
                                        className="text-gray-500 hover:text-gray-700 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700">From: Your Location</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-[#6A0610] rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-700">To: {routeInfo.destination}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{routeInfo.destinationDistrict}</p>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-[#6A0610]">{routeInfo.distance} km</p>
                                            <p className="text-xs text-gray-500">Distance</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-green-600">{routeInfo.estimatedTime} min</p>
                                            <p className="text-xs text-gray-500">Est. Time</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/appointment/${selectedLawyerForDirections._id}`)}
                                            className="flex-1 py-2 px-3 bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all"
                                        >
                                            Book Appointment
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Open in Google Maps
                                                const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation[1]},${userLocation[0]}/${selectedLawyerForDirections.latitude},${selectedLawyerForDirections.longitude}`;
                                                window.open(googleMapsUrl, '_blank');
                                            }}
                                            className="px-3 py-2 bg-white border border-[#6A0610] text-[#6A0610] rounded-lg hover:bg-[#6A0610] hover:text-white transition-all text-xs font-medium"
                                            title="Open in Google Maps"
                                        >
                                            <MapPin className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div id="arcgis-map" className="w-full h-full rounded-xl"></div>
                    </div>
                )}

                {/* Map Size Info */}
                {userLocation && nearestLawyers.length > 0 && (
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Click the expand button to view the map in full screen • Yellow area shows 5km search radius
                        </p>
                    </div>
                )}

                {/* No Location State */}
                {!userLocation && (
                    <div className="border border-gray-200 rounded-2xl p-6 shadow-sm text-center h-80 flex flex-col justify-center">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Lawyers Near You</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Get your location to find the nearest available lawyers
                        </p>
                        <button
                            onClick={getUserLocation}
                            disabled={isGettingLocation}
                            className="px-6 py-2 bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white rounded-full hover:shadow-lg transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            <MapPin className="w-4 h-4" />
                            {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
                        </button>
                    </div>
                )}

                {/* No Results */}
                {userLocation && nearestLawyers.length === 0 && (
                    <div className="border border-gray-200 rounded-2xl p-6 shadow-sm text-center h-80 flex flex-col justify-center">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lawyers Found</h3>
                        <p className="text-gray-600 text-sm">
                            {selectedSpecialty
                                ? `No ${selectedSpecialty} specialists found near you.`
                                : 'No lawyers found near your location.'
                            }
                        </p>
                        {selectedSpecialty && (
                            <button
                                onClick={() => setSelectedSpecialty('')}
                                className="mt-3 px-4 py-2 text-[#6A0610] border border-[#6A0610] rounded-full hover:bg-[#6A0610] hover:text-white transition-all text-sm"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NearestLawyer