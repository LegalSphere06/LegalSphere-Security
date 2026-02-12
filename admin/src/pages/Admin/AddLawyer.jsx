import React, { useContext, useState } from 'react';
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify'
import axios from 'axios';
import Cropper from 'react-easy-crop'

export default function LawyerRegistrationForm() {

    const [lawyerImg, setLawyerImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [gender, setGender] = useState('Male') // Set default to avoid empty option issue
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [password, setPassword] = useState('')
    const [speciality, setSpeciality] = useState('General Practice')
    const [degree, setDegree] = useState('')
    const [officePhone, setOfficePhone] = useState('')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [barAssociation, setBarAssociation] = useState('')
    const [experience, setExperience] = useState('')
    const [professionalType, setProfessionalType] = useState('Attorney-at-Law')
    const [consultationFees, setConsultationFees] = useState('')
    const [primaryCourt, setPrimaryCourt] = useState('')
    const [method, setMethod] = useState('both')
    const [onlineLink, setOnlineLink] = useState('')
    const [district, setDistrict] = useState('Colombo')
    const [address, setAddress] = useState('')
    const [latitude, setLatitude] = useState('')
    const [longitude, setLongitude] = useState('')
    const [languages, setLanguages] = useState([])
    const [additionalInfo, setAdditionalInfo] = useState('')
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageToCrop, setImageToCrop] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const { backendUrl, aToken } = useContext(AdminContext)

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

            // Create a new File object from the blob
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

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            // Validate required fields
            if (!name.trim()) {
                return toast.error('Name is required')
            }
            if (!email.trim()) {
                return toast.error('Email is required')
            }
            if (!phone.trim()) {
                return toast.error('Phone number is required')
            }
            if (!gender) {
                return toast.error('Gender is required')
            }
            if (!licenseNumber.trim()) {
                return toast.error('License number is required')
            }
            if (!district) {
                return toast.error('District is required')
            }
            if (!primaryCourt.trim()) {
                return toast.error('Primary Court is required')
            }

            // Validate at least one language is selected
            if (languages.length === 0) {
                return toast.error('Please select at least one language')
            }

            // Create FormData
            const formData = new FormData()

            // Only append image if it exists
            if (lawyerImg) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(lawyerImg.type)) {
                    return toast.error('Please select a valid image file (JPEG, PNG, WebP)')
                }

                // Validate file size (5MB limit)
                if (lawyerImg.size > 5 * 1024 * 1024) {
                    return toast.error('Image size should be less than 5MB')
                }

                formData.append('image', lawyerImg);
            }

            // Append all form data
            formData.append('name', name.trim());
            formData.append('email', email.trim());
            formData.append('phone', phone.trim());
            formData.append('gender', gender);
            formData.append('dob', dateOfBirth || '');
            formData.append('password', password || '');
            formData.append('speciality', speciality);
            formData.append('degree', degree.trim());
            formData.append('office_phone', officePhone.trim());
            formData.append('license_number', licenseNumber.trim());
            formData.append('bar_association', barAssociation.trim());
            formData.append('experience', experience || '0');
            formData.append('legal_professionals', professionalType);
            formData.append('fees', consultationFees ? Number(consultationFees) : 0);
            formData.append('court1', primaryCourt.trim());
            formData.append('online_link', onlineLink.trim());
            formData.append('district', district);
            formData.append('method', method);

            // Address as JSON string since schema expects Object
            formData.append('address', JSON.stringify({
                street: address.trim(),
                district: district
            }));

            formData.append('latitude', latitude ? Number(latitude) : 0);
            formData.append('longitude', longitude ? Number(longitude) : 0);
            formData.append('about', additionalInfo.trim());

            // Add missing required fields
            formData.append('available', true);
            formData.append('date', Date.now());

            // Languages array
            languages.forEach(lang => {
                formData.append('languages_spoken[]', lang);
            });

            // Console log formdata
            console.log('=== FormData Contents ===');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            const { data } = await axios.post(backendUrl + '/api/admin/add-lawyer', formData, {
                headers: {
                    aToken,
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (data.success) {
                toast.success(data.message)
                // Reset form
                setLawyerImg(false)
                setName('')
                setEmail('')
                setPhone('')
                setGender('Male')
                setDateOfBirth('')
                setPassword('')
                setDegree('')
                setOfficePhone('')
                setLicenseNumber('')
                setBarAssociation('')
                setExperience('')
                setProfessionalType('Attorney-at-Law')
                setConsultationFees('')
                setPrimaryCourt('')
                setOnlineLink('')
                setMethod('both')
                setDistrict('Colombo')
                setAddress('')
                setLatitude('')
                setLongitude('')
                setLanguages([])
                setAdditionalInfo('')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to add lawyer');
            console.log('Error:', error);
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <p className='mb-3 text-lg font-medium'>Add Lawyer</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-h-[80vh] overflow-y-scroll'>
                <div className='max-w-full mx-auto'>

                    {/* Four Column Grid */}
                    <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 h-full'>

                        {/* Left Column - Personal & Location */}
                        <div className='flex flex-col gap-4 h-full'>

                            {/* Personal Information */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Profile Photo</h3>

                                {/* Image Upload */}
                                <div className='flex flex-col items-center gap-2'>
                                    <label htmlFor="lawyer-img" className='cursor-pointer'>
                                        <img
                                            src={lawyerImg ? URL.createObjectURL(lawyerImg) : (assets?.upload_area || '/default-upload.png')}
                                            className='w-56 h-48 object-cover object-top bg-gray-100 rounded cursor-pointer'
                                            alt="Upload area"
                                        />
                                    </label>
                                    <input
                                        onChange={handleImageSelect}
                                        type="file"
                                        id="lawyer-img"
                                        accept="image/*"
                                        hidden
                                    />
                                    <p className='text-[#515151] text-xs text-center leading-tight'>Upload Lawyer's<br />picture</p>
                                </div>
                            </div>

                            {/* Languages - REQUIRED */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>
                                    Languages Spoken <span className="text-red-500">*</span>
                                </h3>
                                <div className='flex flex-col gap-3'>
                                    <label className='flex items-center gap-3 text-sm text-[#515151]'>
                                        <input
                                            type="checkbox"
                                            value="Sinhala"
                                            className='w-4 h-4 rounded'
                                            checked={languages.includes('Sinhala')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setLanguages([...languages, 'Sinhala']);
                                                } else {
                                                    setLanguages(languages.filter(lang => lang !== 'Sinhala'));
                                                }
                                            }}
                                        />
                                        Sinhala
                                    </label>
                                    <label className='flex items-center gap-3 text-sm text-[#515151]'>
                                        <input
                                            type="checkbox"
                                            value="Tamil"
                                            className='w-4 h-4 rounded'
                                            checked={languages.includes('Tamil')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setLanguages([...languages, 'Tamil']);
                                                } else {
                                                    setLanguages(languages.filter(lang => lang !== 'Tamil'));
                                                }
                                            }}
                                        />
                                        Tamil
                                    </label>
                                    <label className='flex items-center gap-3 text-sm text-[#515151]'>
                                        <input
                                            type="checkbox"
                                            value="English"
                                            className='w-4 h-4 rounded'
                                            checked={languages.includes('English')}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setLanguages([...languages, 'English']);
                                                } else {
                                                    setLanguages(languages.filter(lang => lang !== 'English'));
                                                }
                                            }}
                                        />
                                        English
                                    </label>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Additional Info</h3>
                                <div className='grid grid-cols-1 gap-3 h-full'>
                                    <div className='w-full flex-1'>
                                        <textarea
                                            placeholder='Tell us about yourself and your practice'
                                            className='border border-gray-300 rounded w-full p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-22'
                                            value={additionalInfo}
                                            onChange={(e) => setAdditionalInfo(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Second Column - Personal Information */}
                        <div className='flex flex-col gap-4 h-full'>
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Personal Information</h3>
                                <div className='grid grid-cols-1 gap-3'>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            Lawyer Name <span className="text-red-500">*</span>
                                        </p>
                                        <input
                                            type="text"
                                            placeholder='Name'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setName(e.target.value)}
                                            value={name}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            Lawyer Email <span className="text-red-500">*</span>
                                        </p>
                                        <input
                                            type="email"
                                            placeholder='Email'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setEmail(e.target.value)}
                                            value={email}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            Phone Number <span className="text-red-500">*</span>
                                        </p>
                                        <input
                                            type="tel"
                                            placeholder='Phone'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setPhone(e.target.value)}
                                            value={phone}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            Gender <span className="text-red-500">*</span>
                                        </p>
                                        <select
                                            onChange={(e) => setGender(e.target.value)}
                                            value={gender}
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Date of Birth</p>
                                        <input
                                            type="date"
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                            value={dateOfBirth}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Lawyer Password</p>
                                        <input
                                            type="password"
                                            placeholder='Password'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            minLength="6"
                                            onChange={(e) => setPassword(e.target.value)}
                                            value={password}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Third Column - Professional Information */}
                        <div className='flex flex-col gap-4 h-full'>
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Professional Info</h3>
                                <div className='grid grid-cols-1 gap-3'>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Speciality</p>
                                        <select
                                            onChange={(e) => setSpeciality(e.target.value)}
                                            value={speciality}
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Degree</p>
                                        <input
                                            type="text"
                                            placeholder='e.g., LLB, LLM'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={degree}
                                            onChange={(e) => setDegree(e.target.value)}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Office Phone (Optional)</p>
                                        <input
                                            type="tel"
                                            placeholder='Office Phone'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setOfficePhone(e.target.value)}
                                            value={officePhone}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            License Number <span className="text-red-500">*</span>
                                        </p>
                                        <input
                                            type="text"
                                            placeholder='License Number'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setLicenseNumber(e.target.value)}
                                            value={licenseNumber}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Bar Association</p>
                                        <input
                                            type="text"
                                            placeholder='Bar Association'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setBarAssociation(e.target.value)}
                                            value={barAssociation}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Experience (Years)</p>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            placeholder='Years of Experience'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            onChange={(e) => setExperience(e.target.value)}
                                            value={experience}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Legal Professional Type</p>
                                        <select
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={professionalType}
                                            onChange={(e) => setProfessionalType(e.target.value)}
                                        >
                                            <option value="Attorney-at-Law">Attorney-at-Law</option>
                                            <option value="Advocate">Advocate</option>
                                            <option value="Notary Public">Notary Public</option>
                                            <option value="Legal Consultant">Legal Consultant</option>
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Consultation Fees (LKR)</p>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder='Fees'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={consultationFees}
                                            onChange={(e) => setConsultationFees(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fourth Column - Location & Courts */}
                        <div className='flex flex-col gap-4 h-full'>
                            {/* Courts */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Courts</h3>
                                <div className='grid grid-cols-1 gap-3'>
                                                    <div className='w-full'>
                                                    <p className='text-[#515151] text-sm mb-1'>
                                                        Court <span className="text-red-500">*</span>
                                                    </p>
                                                    <select
                                                        className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                                        value={primaryCourt}
                                                        onChange={(e) => setPrimaryCourt(e.target.value)}
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


                                    {/* <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Consultation Method</p>
                                        <select
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                        >
                                            <option value="onsite">Onsite</option>
                                            <option value="online">Online</option>
                                            <option value="both">Online & Onsite</option>
                                        </select>
                                    </div> */}

                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Online Meeting Link (Optional)</p>
                                        <input
                                            type="url"
                                            placeholder='https://meet.google.com/your-link or https://zoom.us/j/your-room'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={onlineLink}
                                            onChange={(e) => setOnlineLink(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location Information */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                                <h3 className='text-lg font-semibold text-[#515151] mb-4'>Location Information</h3>
                                <div className='grid grid-cols-1 gap-3'>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>
                                            District <span className="text-red-500">*</span>
                                        </p>
                                        <select
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                        >
                                            <option value="Colombo">Colombo</option>
                                            <option value="Gampaha">Gampaha</option>
                                            <option value="Kalutara">Kalutara</option>
                                            <option value="Kandy">Kandy</option>
                                            <option value="Matale">Matale</option>
                                            <option value="Nuwara Eliya">Nuwara Eliya</option>
                                            <option value="Galle">Galle</option>
                                            <option value="Matara">Matara</option>
                                            <option value="Hambantota">Hambantota</option>
                                            <option value="Jaffna">Jaffna</option>
                                            <option value="Kilinochchi">Kilinochchi</option>
                                            <option value="Mannar">Mannar</option>
                                            <option value="Vavuniya">Vavuniya</option>
                                            <option value="Mullaitivu">Mullaitivu</option>
                                            <option value="Batticaloa">Batticaloa</option>
                                            <option value="Ampara">Ampara</option>
                                            <option value="Trincomalee">Trincomalee</option>
                                            <option value="Kurunegala">Kurunegala</option>
                                            <option value="Puttalam">Puttalam</option>
                                            <option value="Anuradhapura">Anuradhapura</option>
                                            <option value="Polonnaruwa">Polonnaruwa</option>
                                            <option value="Badulla">Badulla</option>
                                            <option value="Moneragala">Moneragala</option>
                                            <option value="Ratnapura">Ratnapura</option>
                                            <option value="Kegalle">Kegalle</option>
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Address</p>
                                        <textarea
                                            placeholder='Complete Address'
                                            className='border border-gray-300 rounded w-full p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            rows="3"
                                        ></textarea>
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Latitude</p>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder='Latitude'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <p className='text-[#515151] text-sm mb-1'>Longitude</p>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder='Longitude'
                                            className='border border-gray-300 rounded w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-center items-center'>
                                <button
                                    type="submit"
                                    className='bg-blue-600 hover:bg-blue-700 px-10 py-3 text-white rounded-full transition-colors duration-200 font-medium'
                                >
                                    Add Lawyer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Image Crop Modal */}
            {cropModalOpen && imageToCrop && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                        <h3 className="text-xl font-semibold mb-4 text-center">Crop Your Image</h3>

                        {/* Cropper Container */}
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

                        {/* Zoom Control */}
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

                        {/* Instructions */}
                        <div className="mt-4 text-center text-sm text-gray-600">
                            <p>• Drag the image to position it</p>
                            <p>• Use the zoom slider or scroll wheel to resize</p>
                            <p>• The crop area is fixed to 7:6 ratio for optimal display</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                type="button"
                                onClick={cancelCrop}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={applyCrop}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}