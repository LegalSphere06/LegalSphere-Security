import React, { useContext, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { escapeHtml } from '../utils/sanitize'

const Lawyers = () => {
  const { speciality } = useParams()
  const [filterLawyer, setFilterLawyer] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedConsultationMethod, setSelectedConsultationMethod] = useState('')
  const [selectedExperience, setSelectedExperience] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [map, setMap] = useState(null)
  const [view, setView] = useState(null)
  const [graphicsLayer, setGraphicsLayer] = useState(null)
  const [districtLayer, setDistrictLayer] = useState(null)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const mapRef = useRef(null)
  const navigate = useNavigate()

  const { lawyers } = useContext(AppContext)

  // Legal specialties based on the admin form
  const specialties = [
   'Criminal Law',
            'Civil Law',
            'Family Law',
            'Corporate Law',
            'Immigration Law',
            'Property Law',
            'General Practice',
            'Constitutional Law',
            'Labour Law',
            'Intellectual Property Law',
            'Tax Law',
            'Administrative Law',
            'Environmental Law',
            'Human Rights Law',
            'International Law',
            'Commercial Law',
            'Insurance Law',
            'Banking and Finance Law',
            'Maritime Law',
            'Cyber Law',
            'Medical Law',
            'Consumer Law',
            'Education Law',
            'Transport Law',
            'Entertainment Law'
  ]

  // Districts for filtering with coordinates
  const districts = [
    'Colombo',
    'Gampaha',
    'Kalutara',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Vavuniya',
    'Mullaitivu',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Kurunegala',
    'Puttalam',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Monaragala',
    'Ratnapura',
    'Kegalle'
  ]

  // District coordinates and boundaries (approximate)
  const districtData = {
    'Colombo': {
      center: [79.8612, 6.9271],
      bounds: [[79.7, 6.8], [80.0, 7.1]],
      color: [255, 87, 87, 0.3]
    },
    'Gampaha': {
      center: [80.0742, 7.0873],
      bounds: [[79.9, 6.9], [80.3, 7.3]],
      color: [54, 162, 235, 0.3]
    },
    'Kalutara': {
      center: [80.2084, 6.5854],
      bounds: [[79.9, 6.3], [80.4, 6.8]],
      color: [255, 206, 86, 0.3]
    },
    'Kandy': {
      center: [80.6337, 7.2906],
      bounds: [[80.3, 7.0], [80.9, 7.6]],
      color: [75, 192, 192, 0.3]
    },
    'Matale': {
      center: [80.6234, 7.4675],
      bounds: [[80.3, 7.2], [80.9, 7.8]],
      color: [153, 102, 255, 0.3]
    },
    'Nuwara Eliya': {
      center: [80.7891, 6.9497],
      bounds: [[80.5, 6.7], [81.1, 7.2]],
      color: [255, 159, 64, 0.3]
    },
    'Galle': {
      center: [80.2210, 6.0535],
      bounds: [[80.0, 5.9], [80.5, 6.3]],
      color: [201, 203, 207, 0.3]
    },
    'Matara': {
      center: [80.5550, 5.9549],
      bounds: [[80.3, 5.8], [80.8, 6.2]],
      color: [255, 99, 132, 0.3]
    },
    'Hambantota': {
      center: [81.1185, 6.1241],
      bounds: [[80.8, 5.9], [81.4, 6.4]],
      color: [54, 162, 235, 0.3]
    },
    'Jaffna': {
      center: [80.0074, 9.6615],
      bounds: [[79.8, 9.4], [80.3, 9.9]],
      color: [255, 206, 86, 0.3]
    },
    'Kilinochchi': {
      center: [80.3979, 9.3806],
      bounds: [[80.2, 9.1], [80.6, 9.6]],
      color: [75, 192, 192, 0.3]
    },
    'Mannar': {
      center: [79.9042, 8.9810],
      bounds: [[79.6, 8.7], [80.2, 9.3]],
      color: [153, 102, 255, 0.3]
    },
    'Vavuniya': {
      center: [80.4982, 8.7514],
      bounds: [[80.2, 8.5], [80.8, 9.0]],
      color: [255, 159, 64, 0.3]
    },
    'Mullaitivu': {
      center: [80.8142, 9.2654],
      bounds: [[80.5, 9.0], [81.1, 9.5]],
      color: [201, 203, 207, 0.3]
    },
    'Batticaloa': {
      center: [81.7001, 7.7172],
      bounds: [[81.4, 7.4], [82.0, 8.0]],
      color: [255, 99, 132, 0.3]
    },
    'Ampara': {
      center: [81.6747, 7.2966],
      bounds: [[81.3, 7.0], [82.0, 7.6]],
      color: [54, 162, 235, 0.3]
    },
    'Trincomalee': {
      center: [81.2335, 8.5874],
      bounds: [[81.0, 8.3], [81.5, 8.9]],
      color: [255, 206, 86, 0.3]
    },
    'Kurunegala': {
      center: [80.3647, 7.4818],
      bounds: [[80.0, 7.2], [80.7, 7.8]],
      color: [75, 192, 192, 0.3]
    },
    'Puttalam': {
      center: [79.8283, 8.0362],
      bounds: [[79.5, 7.8], [80.2, 8.4]],
      color: [153, 102, 255, 0.3]
    },
    'Anuradhapura': {
      center: [80.4037, 8.3114],
      bounds: [[80.0, 8.0], [80.8, 8.6]],
      color: [255, 159, 64, 0.3]
    },
    'Polonnaruwa': {
      center: [81.0014, 7.9403],
      bounds: [[80.7, 7.6], [81.4, 8.3]],
      color: [201, 203, 207, 0.3]
    },
    'Badulla': {
      center: [81.0550, 6.9934],
      bounds: [[80.7, 6.7], [81.4, 7.3]],
      color: [255, 99, 132, 0.3]
    },
    'Monaragala': {
      center: [81.3507, 6.8728],
      bounds: [[81.0, 6.5], [81.7, 7.2]],
      color: [54, 162, 235, 0.3]
    },
    'Ratnapura': {
      center: [80.4000, 6.6828],
      bounds: [[80.1, 6.4], [80.7, 7.0]],
      color: [255, 206, 86, 0.3]
    },
    'Kegalle': {
      center: [80.3464, 7.2513],
      bounds: [[80.0, 7.0], [80.7, 7.5]],
      color: [75, 192, 192, 0.3]
    }
  }

  const consultationMethods = ['Online', 'Onsite', 'Both']
  const experienceRanges = ['0-2 years', '3-5 years', '6-10 years', '10+ years']
  const languages = ['Sinhala', 'Tamil', 'English']

  // Initialize ArcGIS Map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsMapLoading(true)

        const [Map, MapView, GraphicsLayer, Graphic, Polygon, SimpleFillSymbol, SimpleLineSymbol, Point, SimpleMarkerSymbol, TextSymbol] = await Promise.all([
          import('https://js.arcgis.com/4.28/@arcgis/core/Map.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/views/MapView.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/layers/GraphicsLayer.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/Graphic.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/geometry/Polygon.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/symbols/SimpleFillSymbol.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/symbols/SimpleLineSymbol.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/geometry/Point.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/symbols/SimpleMarkerSymbol.js').then(m => m.default),
          import('https://js.arcgis.com/4.28/@arcgis/core/symbols/TextSymbol.js').then(m => m.default)
        ])

        const graphicsLayer = new GraphicsLayer({ title: 'Lawyers' })
        const districtLayer = new GraphicsLayer({ title: 'Districts' })

        const map = new Map({
          basemap: 'streets-navigation-vector',
          layers: [districtLayer, graphicsLayer]
        })

        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: [80.7718, 7.8731], // Sri Lanka center
          zoom: 7,
          constraints: {
            minZoom: 6,
            maxZoom: 15
          },
          ui: {
            components: ["zoom", "compass"]
          }
        })

        // Add district boundaries
        Object.entries(districtData).forEach(([districtName, data]) => {
          const polygon = new Polygon({
            rings: [[
              [data.bounds[0][0], data.bounds[0][1]],
              [data.bounds[1][0], data.bounds[0][1]],
              [data.bounds[1][0], data.bounds[1][1]],
              [data.bounds[0][0], data.bounds[1][1]],
              [data.bounds[0][0], data.bounds[0][1]]
            ]]
          })

          const fillSymbol = new SimpleFillSymbol({
            color: data.color,
            outline: new SimpleLineSymbol({
              color: [data.color[0], data.color[1], data.color[2], 0.8],
              width: 2
            })
          })

          const districtGraphic = new Graphic({
            geometry: polygon,
            symbol: fillSymbol,
            attributes: {
              district: districtName,
              type: 'district'
            },
            popupTemplate: {
              title: `${escapeHtml(districtName)} District`,
              content: `<div class="p-2">
                <p><strong>District:</strong> ${escapeHtml(districtName)}</p>
                <p><strong>Available Lawyers:</strong>  ${lawyers.filter(l => l.district === districtName).length}</p>
                <p class="text-sm text-gray-600 mt-2">Click to view lawyers in this district</p>
              </div>`
            }
          })

          districtLayer.add(districtGraphic)

          // Add district label
          const labelPoint = new Point({
            longitude: data.center[0],
            latitude: data.center[1]
          })

          const labelSymbol = new TextSymbol({
            text: districtName,
            color: [255, 255, 255],
            haloColor: [0, 0, 0],
            haloSize: 1,
            font: {
              size: 10,
              weight: 'bold'
            }
          })

          const labelGraphic = new Graphic({
            geometry: labelPoint,
            symbol: labelSymbol,
            attributes: {
              district: districtName,
              type: 'label'
            }
          })

          districtLayer.add(labelGraphic)
        })

        await view.when()
        setIsMapLoading(false)

        setMap(map)
        setView(view)
        setGraphicsLayer(graphicsLayer)
        setDistrictLayer(districtLayer)

        // Add click event to map
        view.on('click', (event) => {
          view.hitTest(event).then((response) => {
            if (response.results.length > 0) {
              const graphic = response.results[0].graphic

              // Check if clicked on a lawyer marker
              if (graphic && graphic.attributes && graphic.attributes.lawyerId) {
                navigate(`/appointment/${graphic.attributes.lawyerId}`)
              }

              // Check if clicked on a district
              if (graphic && graphic.attributes && graphic.attributes.district && graphic.attributes.type === 'district') {
                const clickedDistrict = graphic.attributes.district
                setSelectedDistrict(clickedDistrict)
                handleDistrictChange(clickedDistrict)
              }
            }
          })
        })

        // Add hover effects
        view.on('pointer-move', (event) => {
          view.hitTest(event).then((response) => {
            if (response.results.length > 0) {
              const graphic = response.results[0].graphic
              if (graphic && graphic.attributes) {
                if (graphic.attributes.lawyerId || graphic.attributes.type === 'district') {
                  view.container.style.cursor = 'pointer'
                } else {
                  view.container.style.cursor = 'default'
                }
              }
            } else {
              view.container.style.cursor = 'default'
            }
          })
        })

      } catch (error) {
        console.error('Error initializing map:', error)
        setIsMapLoading(false)
      }
    }

    if (mapRef.current) {
      initializeMap()
    }
  }, [navigate, lawyers])

  // Add lawyers to map
  useEffect(() => {
    if (map && view && graphicsLayer) {
      addLawyersToMap()
    }
  }, [map, view, graphicsLayer, filterLawyer])

  const addLawyersToMap = async () => {
    if (!graphicsLayer) return

    try {
      const [Graphic, Point, SimpleMarkerSymbol, TextSymbol] = await Promise.all([
        import('https://js.arcgis.com/4.28/@arcgis/core/Graphic.js').then(m => m.default),
        import('https://js.arcgis.com/4.28/@arcgis/core/geometry/Point.js').then(m => m.default),
        import('https://js.arcgis.com/4.28/@arcgis/core/symbols/SimpleMarkerSymbol.js').then(m => m.default),
        import('https://js.arcgis.com/4.28/@arcgis/core/symbols/TextSymbol.js').then(m => m.default)
      ])

      // Clear existing lawyer graphics
      graphicsLayer.removeAll()

      // Add lawyer markers
      filterLawyer.forEach((lawyer, index) => {
        if (lawyer.latitude && lawyer.longitude) {
          const point = new Point({
            longitude: parseFloat(lawyer.longitude),
            latitude: parseFloat(lawyer.latitude)
          })

          const markerSymbol = new SimpleMarkerSymbol({
            color: [226, 119, 40], // Orange color
            outline: {
              color: [255, 255, 255],
              width: 3
            },
            size: 16
          })

          const graphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            attributes: {
              lawyerId: lawyer._id,
              name: lawyer.name,
              speciality: lawyer.speciality,
              district: lawyer.district
            },
            popupTemplate: {
              title: `⚖️ ${escapeHtml(lawyer.name)}`,
              content: `
                <div class="p-3 font-sans">
                  <div class="mb-3">
                    <img src="${escapeHtml(lawyer.image)}" alt="${escapeHtml(lawyer.name)}" class="w-16 h-16 rounded-full mx-auto object-cover">
                  </div>
                  <div class="space-y-2">
                    <p><strong>🏛️ Specialty:</strong> ${escapeHtml(lawyer.speciality)}</p>
                    <p><strong>📍 District:</strong> ${escapeHtml(lawyer.district)}</p>
                    <p><strong>⏱️ Experience:</strong> ${escapeHtml(String(lawyer.experience))} years</p>
                    <p><strong>💬 Consultation:</strong> ${escapeHtml(lawyer.consultationMethod || '')}</p>
                  </div>
                  <div class="mt-3 pt-2 border-t">
                    <p class="text-sm text-gray-600">Click marker to book appointment</p>
                  </div>
                </div>
              `
            }
          })

          graphicsLayer.add(graphic)
        }
      })

      // Auto-zoom to lawyers when filtered
      if (filterLawyer.length > 0 && selectedDistrict) {
        const validLawyers = filterLawyer.filter(lawyer => lawyer.latitude && lawyer.longitude)
        if (validLawyers.length > 0) {
          const latitudes = validLawyers.map(lawyer => parseFloat(lawyer.latitude))
          const longitudes = validLawyers.map(lawyer => parseFloat(lawyer.longitude))

          const extent = {
            xmin: Math.min(...longitudes) - 0.05,
            ymin: Math.min(...latitudes) - 0.05,
            xmax: Math.max(...longitudes) + 0.05,
            ymax: Math.max(...latitudes) + 0.05
          }

          view.goTo({
            target: extent,
            zoom: 10
          })
        }
      }

    } catch (error) {
      console.error('Error adding lawyers to map:', error)
    }
  }

  const applyFilter = () => {
    let filtered = lawyers

    // Filter by specialty
    if (speciality) {
      filtered = filtered.filter(lawyer => lawyer.speciality === speciality)
    }

    // Filter by district
    if (selectedDistrict) {
      filtered = filtered.filter(lawyer => lawyer.district === selectedDistrict)
    }

    // Filter by consultation method
    if (selectedConsultationMethod) {
      filtered = filtered.filter(lawyer => {
        if (selectedConsultationMethod === 'Both') {
          return lawyer.consultationMethod === 'Online & Onsite'
        }
        return lawyer.consultationMethod?.includes(selectedConsultationMethod)
      })
    }

    // Filter by experience
    if (selectedExperience) {
      filtered = filtered.filter(lawyer => {
        const experience = parseInt(lawyer.experience)
        switch (selectedExperience) {
          case '0-2 years':
            return experience >= 0 && experience <= 2
          case '3-5 years':
            return experience >= 3 && experience <= 5
          case '6-10 years':
            return experience >= 6 && experience <= 10
          case '10+ years':
            return experience > 10
          default:
            return true
        }
      })
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(lawyer => lawyer.languages_spoken?.includes(selectedLanguage))
    }

    setFilterLawyer(filtered)
  }

  const clearFilters = () => {
    setSelectedDistrict('')
    setSelectedConsultationMethod('')
    setSelectedExperience('')
    setSelectedLanguage('')
    navigate('/lawyers')

    // Reset map view to show all of Sri Lanka
    if (view) {
      view.goTo({
        center: [80.7718, 7.8731],
        zoom: 7
      })
    }
  }

  const handleDistrictChange = (district) => {
    setSelectedDistrict(district)

    // Zoom to district if selected
    if (district && view) {
      const districtInfo = districtData[district]
      if (districtInfo) {
        view.goTo({
          center: districtInfo.center,
          zoom: 10
        })
      }
    }
  }

  useEffect(() => {
    applyFilter()
  }, [lawyers, speciality, selectedDistrict, selectedConsultationMethod, selectedExperience, selectedLanguage])

  return (
    <div className='min-h-screen bg-[#D8D8E3]'>
      <div className='max-w-7xl mx-auto'>
        <div className='text-left text-2xl text-gray-500 mb-[5px] pt-5 pb-5'>
          <p>Explore <span className='text-gray-700 font-medium'>Lawyers</span></p>
        </div>
        <div className="border border-gray-200 rounded-2xl px-4 py-2 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Specialty Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Legal Specialty
              </label>
              <select
                value={speciality || ''}
                onChange={(e) => e.target.value ? navigate(`/lawyers/${e.target.value}`) : navigate('/lawyers')}
                className="w-full px-4 py-1 text-sm text-gray-700 border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none "
                style={{ backgroundColor: '#D8D8E3' }}

              >
                <option
                  value="">All Specialties</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-4 py-1 text-sm text-gray-700 border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none"
                style={{ backgroundColor: '#D8D8E3' }}

              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Experience Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Experience Level
              </label>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="w-full px-4 py-1 text-sm text-gray-700 border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none"
                style={{ backgroundColor: '#D8D8E3' }}

              >
                <option value="">All Experience</option>
                {experienceRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-1 text-sm text-gray-700 border border-[#6A0610] rounded-full focus:ring-2 focus:ring-[#6A0610] focus:outline-none"
                style={{ backgroundColor: '#D8D8E3' }}

              >
                <option value="">All Languages</option>
                {languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-1 text-sm text-[#6A0610] border border-[#6A0610] rounded-full hover:bg-[#6A0610] hover:text-white transition-all"
                title="Clear all filters"
              >
                Clear
              </button>
            </div>
          </div>
        </div>


        {/* Main Content Area */}
        <div className='flex flex-col lg:flex-row gap-1'>
          {/* Enhanced Map Section */}
          <div className='lg:w-1/2'>
            <div className='bg-white l shadow-lg overflow-hidden border border-gray-200'>
              <div className='bg-[#030303] text-white p-4'>
                <h2 className='text-xl font-bold flex items-center gap-2'>
                  Explore With Map
                  {selectedDistrict && <span className='text-blue-200'>- {selectedDistrict}</span>}
                </h2>
                <p className='text-blue-100 text-sm mt-1'>Click on districts or lawyer markers to explore</p>
              </div>

              <div className='relative h-[500px] lg:h-[700px]'>
                {isMapLoading && (
                  <div className='absolute inset-0 bg-gray-100 flex items-center justify-center z-10'>
                    <div className='text-center'>
                      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                      <p className='text-gray-600 font-medium'>Loading Map...</p>
                    </div>
                  </div>
                )}
                <div ref={mapRef} className='w-full h-full'></div>
              </div>

              <div className='bg-gray-50 p-4 border-t'>
                <div className='flex items-center justify-between text-sm text-gray-600'>
                  <span>🔍 Showing {filterLawyer.length} lawyers</span>
                  <span>💡 Tip: Click districts to filter lawyers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Lawyers Cards Section */}
          <div className='lg:w-1/2 bg-white'>
            <div className='bg-gradient-to-r from-[#6A0610] to-[#D00C1F] text-white p-4'>
              <div className='flex justify-between'>
                <h2 className='text-xl font-bold flex items-center gap-2'>
                  Available Lawyers  {selectedDistrict && <span className='text-white font-medium'> - in {selectedDistrict}</span>}

                </h2>


                <div className='bg-gradient-to-br from-gray-900 to-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold'>
                  {filterLawyer.length} Found
                </div>
              </div>
              <p className='text-blue-100 text-sm mt-1'>

                Click on districts or lawyer markers to explore
              </p>
            </div>

            <div className='flex justify-between items-center mb-6 mt-2 pl-2 pr-2'>
              <div className='max-h-[658px] overflow-y-auto w-full'>
                <div className='grid grid-cols-1 sm:grid-cols-4 gap-2'>
                  {filterLawyer.map((item, index) => (
                    <div
                      onClick={() => navigate(`/appointment/${item._id}`)}
                      className='bg-[#030303] rounded-[8px] p-1 pt-2 cursor-pointer duration-300 shadow-lg border border-gray-700'
                      key={index}
                    >
                      {/* Profile Image with Availability Badge */}
                      <div className="flex justify-center  relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Availability Badge */}
                        <div className={`absolute top-0 right-0 flex items-center gap-1 ${item.available ? ' bg-green-500 ' : 'bg-red-500'} px-1 py-1 rounded-full shadow-lg`}>
                          <div className={`w-1 h-1 ${item.available ? ' bg-green-300 ' : 'bg-red-200'} rounded-full animate-pulse`}></div>
                          {/* <span className="text-xs text-white font-semibold">Online</span>*/}
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="text-white text-[14px]  font-bold text-center mt-3 leading-tight">
                        {item.name}
                      </h3>

                      {/* Specialized Area */}
                      <div className=" mb-1 mt-1 bg-gray-700 p-1 rounded-[5px]">
                        <p className="text-white text-[12px] text-center font-medium">
                          {item.speciality}
                        </p>
                      </div>

                      {/* Info Grid */}
                      <div className="mb-[2px] flex justify-between">
                        <div className="flex items-center justify-between bg-gray-700 p-1 rounded-[5px]">
                          <span className="text-white text-[10px] pl-1 pr-1 ">{item.district}</span>
                        </div>

                        <div className="flex items-center justify-between bg-gray-700 p-1 rounded-[5px]">
                          <span className="text-white text-[10px] pl-1 pr-1">{item.experience} yrs</span>
                        </div>

                        <div className="flex items-center justify-between bg-gray-700 p-1 rounded-[5px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (view && item.latitude && item.longitude) {
                                view.goTo({
                                  center: [parseFloat(item.longitude), parseFloat(item.latitude)],
                                  zoom: 12
                                });
                              }
                            }}
                            className="text-red-500"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div>
                        <div className="mt-1  p-1 rounded-[5px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/appointment/${item._id}`);
                            }}
                            className="mt-2 flex items-center justify-center gap-1 w-full h-6 text-white rounded-[5px] text-xs font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            style={{
                              background: 'linear-gradient(to right, #6A0610, #D00C1F)',
                              boxShadow: '0px 0px 0px rgba(255, 255, 255, 0.3), 0px 1px 0px 0px rgba(255, 255, 255, 0.2)'
                            }}


                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span >Book</span>
                          </button>
                        </div>


                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* No Results Message */}
              {filterLawyer.length === 0 && (
                <div className='text-center py-12'>
                  <div className='text-6xl mb-4'>🔍</div>
                  <h3 className='text-2xl font-bold text-gray-900 mb-3'>No lawyers found</h3>
                  <p className='text-gray-600 mb-6 text-lg'>
                    {selectedDistrict
                      ? `No lawyers available in ${selectedDistrict} district with your selected criteria`
                      : 'Try adjusting your filters to see more results'
                    }
                  </p>
                  <button
                    onClick={clearFilters}
                    className='px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105'
                  >
                    🔄 Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}

export default Lawyers
