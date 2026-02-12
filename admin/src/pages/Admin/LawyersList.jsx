import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import Cropper from 'react-easy-crop'

const LawyersList = () => {
    const { lawyers, aToken, getAllLawyers, changeAvailability, backendUrl } = useContext(AdminContext)
    const [viewMode, setViewMode] = useState('cards') // "cards" or "table"
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingLawyer, setEditingLawyer] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingLawyer, setDeletingLawyer] = useState(null)

    // Form states for editing
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: 'Male',
        dateOfBirth: '',
        speciality: 'General Practice',
        degree: '',
        officePhone: '',
        licenseNumber: '',
        barAssociation: '',
        experience: '',
        professionalType: 'Attorney-at-Law',
        consultationFees: '',
        primaryCourt: '',
        method: 'both',
        onlineLink: '',
        district: 'Colombo',
        address: '',
        latitude: '',
        longitude: '',
        languages: [],
        additionalInfo: '',
        available: true
    })

    const [lawyerImg, setLawyerImg] = useState(null)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageToCrop, setImageToCrop] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    // Different pagination limits for each view
    const cardItemsPerPage = 10
    const tableItemsPerPage = 8
    const itemsPerPage = viewMode === 'cards' ? cardItemsPerPage : tableItemsPerPage

    useEffect(() => {
        if (aToken) {
            getAllLawyers()
        }
    }, [aToken])

    // Filter lawyers based on search term
    const filteredLawyers = lawyers.filter(lawyer =>
        lawyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.speciality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.court1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Pagination logic - use filtered lawyers
    const totalPages = Math.ceil(filteredLawyers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentItems = filteredLawyers.slice(startIndex, startIndex + itemsPerPage)

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Reset to first page when search term changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Helper function to create image from URL
    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous')
            image.src = url
        })

    // Helper function to get cropped image
    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/jpeg', 0.9)
        })
    }

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please select a valid image file (JPEG, PNG, WebP)')
                return
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB')
                return
            }

            setImageToCrop(file)
            setCropModalOpen(true)
        }
    }

    // Handle crop complete
    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    // Apply crop
    const applyCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(
                URL.createObjectURL(imageToCrop),
                croppedAreaPixels
            )

            const croppedFile = new File([croppedImage], imageToCrop.name, {
                type: imageToCrop.type,
            })

            setLawyerImg(croppedFile)
            setCropModalOpen(false)
            setImageToCrop(null)
            setCrop({ x: 0, y: 0 })
            setZoom(1)
        } catch (error) {
            console.error('Error cropping image:', error)
            toast.error('Error cropping image')
        }
    }

    // Cancel crop
    const cancelCrop = () => {
        setCropModalOpen(false)
        setImageToCrop(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
    }

    // Open edit modal
    const handleEdit = async (lawyer) => {
        try {
            const response = await axios.get(`${backendUrl}/api/admin/lawyer/${lawyer._id}`, {
                headers: { aToken }
            })

            if (response.data.success) {
                const lawyerData = response.data.lawyer
                setEditingLawyer(lawyerData)
                setFormData({
                    name: lawyerData.name || '',
                    email: lawyerData.email || '',
                    phone: lawyerData.phone || '',
                    gender: lawyerData.gender || 'Male',
                    dateOfBirth: lawyerData.dob || '',
                    speciality: lawyerData.speciality || 'General Practice',
                    degree: lawyerData.degree || '',
                    officePhone: lawyerData.office_phone || '',
                    licenseNumber: lawyerData.license_number || '',
                    barAssociation: lawyerData.bar_association || '',
                    experience: lawyerData.experience || '',
                    professionalType: lawyerData.legal_professionals || 'Attorney-at-Law',
                    consultationFees: lawyerData.fees || '',
                    primaryCourt: lawyerData.court1 || '',
                    method: lawyerData.method || 'both',
                    onlineLink: lawyerData.online_link || '',
                    district: lawyerData.district || 'Colombo',
                    address: lawyerData.address?.street || '',
                    latitude: lawyerData.latitude || '',
                    longitude: lawyerData.longitude || '',
                    languages: lawyerData.languages_spoken || [],
                    additionalInfo: lawyerData.about || '',
                    available: lawyerData.available || true
                })
                setLawyerImg(null)
                setShowEditModal(true)
            }
        } catch (error) {
            toast.error('Failed to fetch lawyer details')
            console.log(error)
        }
    }

    // Handle update lawyer
    const handleUpdateLawyer = async (e) => {
        e.preventDefault()

        try {
            const formDataToSend = new FormData()

            if (lawyerImg) {
                formDataToSend.append('image', lawyerImg)
            }

            formDataToSend.append('name', formData.name.trim())
            formDataToSend.append('email', formData.email.trim())
            formDataToSend.append('phone', formData.phone.trim())
            formDataToSend.append('gender', formData.gender)
            formDataToSend.append('dob', formData.dateOfBirth)
            formDataToSend.append('speciality', formData.speciality)
            formDataToSend.append('degree', formData.degree.trim())
            formDataToSend.append('office_phone', formData.officePhone.trim())
            formDataToSend.append('license_number', formData.licenseNumber.trim())
            formDataToSend.append('bar_association', formData.barAssociation.trim())
            formDataToSend.append('experience', formData.experience || '0')
            formDataToSend.append('legal_professionals', formData.professionalType)
            formDataToSend.append('fees', formData.consultationFees ? Number(formData.consultationFees) : 0)
            formDataToSend.append('court1', formData.primaryCourt.trim())
            formDataToSend.append('online_link', formData.onlineLink.trim())
            formDataToSend.append('district', formData.district)
            formDataToSend.append('method', formData.method)
            formDataToSend.append('address', JSON.stringify({
                street: formData.address.trim(),
                district: formData.district
            }))
            formDataToSend.append('latitude', formData.latitude ? Number(formData.latitude) : 0)
            formDataToSend.append('longitude', formData.longitude ? Number(formData.longitude) : 0)
            formDataToSend.append('about', formData.additionalInfo.trim() || 'No additional information provided')
            formDataToSend.append('available', formData.available)

            formData.languages.forEach(lang => {
                formDataToSend.append('languages_spoken[]', lang)
            })

            const { data } = await axios.put(`${backendUrl}/api/admin/lawyer/${editingLawyer._id}`, formDataToSend, {
                headers: {
                    aToken,
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (data.success) {
                toast.success(data.message)
                setShowEditModal(false)
                setEditingLawyer(null)
                setLawyerImg(null)
                getAllLawyers() // Refresh the lawyers list
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to update lawyer')
            console.log('Error:', error)
        }
    }

    // Handle delete
    const handleDelete = (lawyer) => {
        setDeletingLawyer(lawyer)
        setShowDeleteModal(true)
    }

    // Confirm delete
    const confirmDelete = async () => {
        try {
            const { data } = await axios.delete(`${backendUrl}/api/admin/lawyer/${deletingLawyer._id}`, {
                headers: { aToken }
            })

            if (data.success) {
                toast.success(data.message)
                setShowDeleteModal(false)
                setDeletingLawyer(null)
                getAllLawyers() // Refresh the lawyers list
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to delete lawyer')
            console.log('Error:', error)
        }
    }

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            {/* Header with search and tab switch */}
            <div className='flex justify-between items-center mb-4 gap-4'>
                <h1 className='text-lg font-medium'>All Lawyers</h1>

                {/* Search Bar */}
                <div className='flex-1 max-w-md'>
                    <div className='relative'>
                        <input
                            type="text"
                            placeholder="Search by name, email, speciality, district, court, or license..."
                            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            >
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* View Toggle Buttons */}
                <div className='flex gap-2'>
                    <button
                        onClick={() => { setViewMode('cards'); setCurrentPage(1) }}
                        className={`px-4 py-1 rounded-full border ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
                    >
                        Card View
                    </button>
                    <button
                        onClick={() => { setViewMode('table'); setCurrentPage(1) }}
                        className={`px-4 py-1 rounded-full border ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
                    >
                        Table View
                    </button>
                </div>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
                <div className='mb-4 text-sm text-gray-600'>
                    Found {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''} matching "{searchTerm}"
                    {filteredLawyers.length === 0 && (
                        <span className='block mt-1 text-gray-500'>Try searching by name, email, speciality, district, court, or license number</span>
                    )}
                </div>
            )}

            {/* No Results Message */}
            {filteredLawyers.length === 0 && !searchTerm && (
                <div className='text-center py-12 text-gray-500'>
                    <p className='text-lg mb-2'>No lawyers found</p>
                    <p className='text-sm'>Add some lawyers to get started</p>
                </div>
            )}

            {filteredLawyers.length === 0 && searchTerm && (
                <div className='text-center py-12 text-gray-500'>
                    <p className='text-lg mb-2'>No lawyers match your search</p>
                    <p className='text-sm'>Try adjusting your search terms or clear the search to see all lawyers</p>
                </div>
            )}

            {/* CARD VIEW */}
            {viewMode === 'cards' && filteredLawyers.length > 0 && (
                <>
                    <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
                        {currentItems.map((item, index) => (
                            <div className='border border-indigo-200 rounded-xl w-48 overflow-hidden cursor-pointer group' key={index}>
                                <img
                                    className='w-48 h-36 object-cover object-top bg-indigo-50 group-hover:bg-primary transition-all duration-500'
                                    src={item.image}
                                    alt={item.name || 'Lawyer'}
                                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                                />
                                <div className='p-3'>
                                    <p className='text-base font-medium text-gray-900 truncate'>{item.name}</p>
                                    <p className='text-sm text-gray-600 truncate'>{item.speciality}</p>
                                    <p className='text-xs text-gray-500 mt-1 truncate'>{item.court1 || '-'}</p>
                                    <div className='flex items-center gap-2 mt-2 p-2 rounded'>
                                        <input
                                            onChange={() => changeAvailability(item._id)}
                                            className="accent-indigo-500"
                                            type="checkbox"
                                            checked={item.available}
                                        />
                                        <p className='text-sm'>Available</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginator */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-4">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                className={`px-3 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            <p className="text-sm">Page {currentPage} of {totalPages}</p>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && filteredLawyers.length > 0 && (
                <>
                    <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll w-full'>
                        {/* Table header */}
                        <div className='hidden sm:grid grid-cols-[0.3fr_1.5fr_2fr_1.2fr_1.5fr_1.2fr_0.7fr_1fr] py-3 px-6 border-b font-medium text-gray-700 bg-gray-50'>
                            <p>#</p>
                            <p>Name</p>
                            <p>Email</p>
                            <p>Phone</p>
                            <p>Speciality</p>
                            <p>Primary Court</p>
                            <p>Available</p>
                            <p>Actions</p>
                        </div>

                        {/* Table rows */}
                        {currentItems.map((item, index) => (
                            <div
                                key={index}
                                className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.3fr_1.5fr_2fr_1.2fr_1.5fr_1.2fr_0.7fr_1fr] items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50'
                            >
                                <p className='max-sm:hidden'>{startIndex + index + 1}</p>
                                <div className='flex items-center gap-2'>
                                    <img
                                        src={item.image}
                                        alt={item.name || 'Lawyer'}
                                        className='w-8 h-8 rounded-full object-cover'
                                        onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                                    />
                                    <p className='truncate'>{item.name}</p>
                                </div>
                                <p className='truncate'>{item.email || '-'}</p>
                                <p>{item.phone || '-'}</p>
                                <p className='truncate'>{item.speciality || '-'}</p>
                                <p className='truncate'>{item.court1 || '-'}</p>
                                <input
                                    type='checkbox'
                                    checked={item.available}
                                    onChange={() => changeAvailability(item._id)}
                                    className="accent-indigo-500"
                                />
                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className='p-1 hover:bg-blue-100 rounded text-blue-600'
                                        title='Edit Lawyer'
                                    >
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className='p-1 hover:bg-red-100 rounded text-red-600'
                                        title='Delete Lawyer'
                                    >
                                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginator */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-4">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                className={`px-3 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            <p className="text-sm">Page {currentPage} of {totalPages}</p>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Edit Modal */}
            {showEditModal && editingLawyer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Edit Lawyer - {editingLawyer.name}</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleUpdateLawyer}>
                                <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
                                    {/* Image Column */}
                                    <div className='flex flex-col gap-4'>
                                        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
                                            <h3 className='text-lg font-semibold text-[#515151] mb-4'>Profile Photo</h3>
                                            <div className='flex flex-col items-center gap-2'>
                                                <label htmlFor="edit-lawyer-img" className='cursor-pointer'>
                                                    <img
                                                        src={lawyerImg ? URL.createObjectURL(lawyerImg) : editingLawyer.image}
                                                        className='w-48 h-40 object-cover object-top bg-gray-100 rounded cursor-pointer'
                                                        alt="Lawyer"
                                                    />
                                                </label>
                                                <input
                                                    onChange={handleImageSelect}
                                                    type="file"
                                                    id="edit-lawyer-img"
                                                    accept="image/*"
                                                    hidden
                                                />
                                                <p className='text-[#515151] text-xs text-center'>Click to change photo</p>
                                            </div>
                                        </div>

                                        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
                                            <h3 className='text-lg font-semibold text-[#515151] mb-4'>Languages Spoken</h3>
                                            <div className='flex flex-col gap-3'>
                                                {['Sinhala', 'Tamil', 'English'].map(lang => (
                                                    <label key={lang} className='flex items-center gap-3 text-sm text-[#515151]'>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.languages.includes(lang)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({ ...formData, languages: [...formData.languages, lang] })
                                                                } else {
                                                                    setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) })
                                                                }
                                                            }}
                                                            className='w-4 h-4 rounded'
                                                        />
                                                        {lang}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Info Column */}
                                    <div className='flex flex-col gap-4'>
                                        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
                                            <h3 className='text-lg font-semibold text-[#515151] mb-4'>Personal Information</h3>
                                            <div className='grid grid-cols-1 gap-3'>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Name</p>
                                                    <input
                                                        type="text"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Email</p>
                                                    <input
                                                        type="email"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Phone</p>
                                                    <input
                                                        type="tel"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Gender</p>
                                                    <select
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Date of Birth</p>
                                                    <input
                                                        type="date"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.dateOfBirth}
                                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info Column */}
                                    <div className='flex flex-col gap-4'>
                                        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
                                            <h3 className='text-lg font-semibold text-[#515151] mb-4'>Professional Info</h3>
                                            <div className='grid grid-cols-1 gap-3'>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Speciality</p>
                                                    <select
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.speciality}
                                                        onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                                                    >
                                        <option value="Criminal Law">Criminal Law</option>
                                        <option value="Civil Law">Civil Law</option>
                                        <option value="Family Law">Family Law</option>
                                        <option value="Corporate Law">Corporate Law</option>
                                        <option value="Immigration Law">Immigration Law</option>
                                        <option value="Property Law">Property Law</option>
                                        <option value="General Practice">General Practice</option>
                                        <option value="Constitutional Law">Constitutional Law</option>
                                        <option value="Labour Law">Labour Law</option>
                                        <option value="Intellectual Property Law">Intellectual Property Law</option>
                                        <option value="Tax Law">Tax Law</option>
                                        <option value="Administrative Law">Administrative Law</option>
                                        <option value="Environmental Law">Environmental Law</option>
                                        <option value="Human Rights Law">Human Rights Law</option>
                                        <option value="International Law">International Law</option>
                                        <option value="Commercial Law">Commercial Law</option>
                                        <option value="Insurance Law">Insurance Law</option>
                                        <option value="Banking and Finance Law">Banking and Finance Law</option>
                                        <option value="Maritime Law">Maritime Law</option>
                                        <option value="Cyber Law">Cyber Law</option>
                                        <option value="Medical Law">Medical Law</option>
                                        <option value="Consumer Law">Consumer Law</option>
                                        <option value="Education Law">Education Law</option>
                                        <option value="Transport Law">Transport Law</option>
                                        <option value="Entertainment Law">Entertainment Law</option>
                                                    </select>
                                                </div>
<div>
  <p className='text-[#515151] text-sm mb-1'>Degree</p>
  <select
    className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
    value={formData.degree}
    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
    required
  >
    <option value="">Select Degree</option>
    <option value="Attorney-at-Law (Sri Lanka Law College)">Attorney-at-Law (Sri Lanka Law College)</option>
    <option value="LL.B (University of Colombo)">LL.B (University of Colombo)</option>
    <option value="LL.B (University of Peradeniya)">LL.B (University of Peradeniya)</option>
    <option value="LL.B (Open University of Sri Lanka)">LL.B (Open University of Sri Lanka)</option>
    <option value="LL.B (General Sir John Kotelawala Defence University)">LL.B (General Sir John Kotelawala Defence University)</option>
    <option value="LL.B (University of London)">LL.B (University of London)</option>
    <option value="LL.M (Master of Laws)">LL.M (Master of Laws)</option>
    <option value="PhD in Law">PhD in Law</option>
    <option value="Diploma in Law">Diploma in Law</option>
    <option value="Other">Other</option>
  </select>

  {/* Show text input if "Other" is selected */}
  {formData.degree === 'Other' && (
    <input
      type="text"
      placeholder="Please specify your degree"
      className="mt-2 border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      value={formData.otherDegree || ''}
      onChange={(e) => setFormData({ ...formData, otherDegree: e.target.value })}
      required
    />
  )}
</div>

                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>License Number</p>
                                                    <input
                                                        type="text"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.licenseNumber}
                                                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Experience (Years)</p>
                                                    <input
                                                        type="number"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.experience}
                                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Consultation Fees (LKR)</p>
                                                    <input
                                                        type="number"
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.consultationFees}
                                                        onChange={(e) => setFormData({ ...formData, consultationFees: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location & Courts Column */}
                                    <div className='flex flex-col gap-4'>
                                        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
                                            <h3 className='text-lg font-semibold text-[#515151] mb-4'>Location & Courts</h3>
                                            <div className='grid grid-cols-1 gap-3'>
            <div>
            <p className='text-[#515151] text-sm mb-1'>Court <span className="text-red-500">*</span></p>
            <select
                className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                value={formData.primaryCourt}
                onChange={(e) => setFormData({ ...formData, primaryCourt: e.target.value })}
                required
            >
                <option value="">Select Court</option>
                <option value="Supreme Court">Supreme Court</option>
                <option value="Court of Appeal">Court of Appeal</option>
                <option value="High Court">High Court</option>
                <option value="Commercial High Court">Commercial High Court</option>
                <option value="District Court">District Court</option>
                <option value="Magistrate’s Court">Magistrate’s Court</option>
                <option value="Primary Court">Primary Court</option>
                <option value="Labour Tribunal">Labour Tribunal</option>
                <option value="Juvenile Court">Juvenile Court</option>
                <option value="Military Court">Military Court</option>
                <option value="Environmental Tribunal">Environmental Tribunal</option>
                <option value="Tax Appeals Commission">Tax Appeals Commission</option>
            </select>
            </div>

                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>District</p>
                                                    <select
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.district}
                                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                                    >
                                                        <option value="Colombo">Colombo</option>
                                                        <option value="Gampaha">Gampaha</option>
                                                        <option value="Kalutara">Kalutara</option>
                                                        <option value="Kandy">Kandy</option>
                                                        <option value="Galle">Galle</option>
                                                        <option value="Matara">Matara</option>
                                                        <option value="Hambantota">Hambantota</option>
                                                        <option value="Jaffna">Jaffna</option>
                                                        <option value="Batticaloa">Batticaloa</option>
                                                        <option value="Kurunegala">Kurunegala</option>
                                                        <option value="Anuradhapura">Anuradhapura</option>
                                                        <option value="Ratnapura">Ratnapura</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Address</p>
                                                    <textarea
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        rows="2"
                                                    />
                                                </div>
                                                {/* <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Consultation Method</p>
                                                    <select
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.method}
                                                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                                    >
                                                        <option value="onsite">Onsite</option>
                                                        <option value="online">Online</option>
                                                        <option value="both">Both</option>
                                                    </select>
                                                </div> */}
                                                <div>
                                                    <p className='text-[#515151] text-sm mb-1'>Additional Info</p>
                                                    <textarea
                                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                                        value={formData.additionalInfo}
                                                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                                        rows="3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Update Lawyer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingLawyer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deletingLawyer.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Crop Modal */}
            {cropModalOpen && imageToCrop && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                        <h3 className="text-xl font-semibold mb-4 text-center">Crop Your Image</h3>

                        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                            <Cropper
                                image={URL.createObjectURL(imageToCrop)}
                                crop={crop}
                                zoom={zoom}
                                aspect={7 / 6}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="rect"
                                showGrid={true}
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-4">
                            <span className="text-sm text-gray-600">Zoom:</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-48"
                            />
                            <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={cancelCrop}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={applyCrop}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LawyersList