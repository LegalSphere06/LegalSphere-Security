import React, { useContext, useEffect, useState } from 'react';
import { LawyerContext } from '../../context/LawyerContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Cropper from 'react-easy-crop';

const LawyerProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData, backendUrl } = useContext(LawyerContext);
    const { currency } = useContext(AppContext);

    const [isEdit, setIsEdit] = useState(false);
    const [lawyerImg, setLawyerImg] = useState(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Helper functions for image cropping
    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

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
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Please select a valid image file (JPEG, PNG, WebP)');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            setImageToCrop(file);
            setCropModalOpen(true);
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const applyCrop = async () => {
        try {
            const croppedImage = await getCroppedImg(
                URL.createObjectURL(imageToCrop),
                croppedAreaPixels
            );

            const croppedFile = new File([croppedImage], imageToCrop.name, {
                type: imageToCrop.type,
            });

            setLawyerImg(croppedFile);
            setCropModalOpen(false);
            setImageToCrop(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        } catch (error) {
            console.error('Error cropping image:', error);
            toast.error('Error cropping image');
        }
    };

    const cancelCrop = () => {
        setCropModalOpen(false);
        setImageToCrop(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };
    const getLawyerImage = (data) => {
  if (data?.image && data.image.trim() !== '') {
    return data.image;
  }
  return 'https://via.placeholder.com/150/cccccc/666666?text=No+Image';
}

    const updateProfile = async () => {
        try {
            const formDataToSend = new FormData();

            // Add image if selected
            if (lawyerImg) {
                formDataToSend.append('image', lawyerImg);
            }

            // Add all profile fields
            formDataToSend.append('name', profileData.name || '');
            formDataToSend.append('email', profileData.email || '');
            formDataToSend.append('phone', profileData.phone || '');
            formDataToSend.append('office_phone', profileData.office_phone || '');
            formDataToSend.append('gender', profileData.gender || '');
            formDataToSend.append('dob', profileData.dob || '');
            formDataToSend.append('speciality', profileData.speciality || '');
            formDataToSend.append('degree', Array.isArray(profileData.degree) ? profileData.degree.join(', ') : profileData.degree || '');
            formDataToSend.append('district', profileData.district || '');
            formDataToSend.append('license_number', profileData.license_number || '');
            formDataToSend.append('bar_association', profileData.bar_association || '');
            formDataToSend.append('experience', profileData.experience || '');
            formDataToSend.append('legal_professionals', Array.isArray(profileData.legal_professionals) ? profileData.legal_professionals.join(', ') : profileData.legal_professionals || '');
            formDataToSend.append('fees', profileData.fees || 0);
            formDataToSend.append('address', JSON.stringify(profileData.address || {}));
            formDataToSend.append('latitude', profileData.latitude || 0);
            formDataToSend.append('longitude', profileData.longitude || 0);
            formDataToSend.append('court1', profileData.court1 || '');
            formDataToSend.append('court2', profileData.court2 || '');
            formDataToSend.append('method', profileData.method || 'both');
            formDataToSend.append('online_link', profileData.online_link || '');
            formDataToSend.append('languages_spoken', profileData.languages_spoken ? profileData.languages_spoken.join(', ') : '');
            formDataToSend.append('about', profileData.about || '');
            formDataToSend.append('available', profileData.available);

            const { data } = await axios.post(
                backendUrl + '/api/lawyer/update-profile',
                formDataToSend,
                {
                    headers: {
                        dtoken: dToken, // Note: using lowercase 'dtoken' to match your middleware
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (data.success) {
                toast.success(data.message);
                setIsEdit(false);
                setLawyerImg(null);
                
                // Update profile data if returned from backend
                if (data.profileData) {
                    setProfileData(data.profileData);
                } else {
                    // Otherwise fetch the updated data
                    getProfileData();
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            console.log('Update error:', error);
        }
    };

    const updatePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            const { data } = await axios.post(
                backendUrl + '/api/lawyer/change-password',
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { dtoken: dToken } } // Note: using lowercase 'dtoken'
            );

            if (data.success) {
                toast.success(data.message);
                setShowPasswordChange(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        if (dToken) {
            getProfileData();
        }
    }, [dToken]);

    // Show loading state while profileData is null
    if (!profileData) {
        return (
            <div className='m-5 flex items-center justify-center h-screen'>
                <p className='text-gray-600'>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            {/* Header */}
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-lg font-medium'>Lawyer Profile</h1>
                <div className='flex gap-2'>
                    <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className='px-4 py-1 rounded-full border text-gray-700 hover:bg-blue-100'
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => {
                            if (isEdit) {
                                // Reset to original data on cancel
                                getProfileData();
                                setLawyerImg(null);
                            }
                            setIsEdit(!isEdit);
                        }}
                        className={`px-4 py-1 rounded-full border ${isEdit ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                        {isEdit ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>
            </div>

            {/* Password Change Section */}
            {showPasswordChange && (
                <div className='bg-white border rounded-lg p-4 mb-4'>
                    <h3 className='text-lg font-semibold mb-4'>Change Password</h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <label className='text-sm font-medium text-gray-700 mb-1 block'>Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className='border border-gray-300 rounded w-full p-2 text-sm'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-gray-700 mb-1 block'>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className='border border-gray-300 rounded w-full p-2 text-sm'
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-gray-700 mb-1 block'>Confirm Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className='border border-gray-300 rounded w-full p-2 text-sm'
                            />
                        </div>
                    </div>
                    <button
                        onClick={updatePassword}
                        className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                    >
                        Update Password
                    </button>
                </div>
            )}

            {/* Main Grid Layout */}
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
                {/* Left Column - Image & Languages */}
                <div className='flex flex-col gap-4'>
                    {/* Profile Image */}
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-fit'>
                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Profile Photo</h3>
                        <div className='flex flex-col items-center gap-2'>
                            <label htmlFor="profile-img" className='cursor-pointer'>
                           <img
  src={lawyerImg ? URL.createObjectURL(lawyerImg) : getLawyerImage(profileData)}
  className='w-48 h-40 object-cover object-top bg-gray-100 rounded cursor-pointer'
  alt="Profile"
/>
                            </label>
                            {isEdit && (
                                <>
                                    <input
                                        onChange={handleImageSelect}
                                        type="file"
                                        id="profile-img"
                                        accept="image/*"
                                        hidden
                                    />
                                    <p className='text-gray-600 text-xs text-center'>Click to change photo</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Languages Spoken</h3>
                        {isEdit ? (
                            <div className='flex flex-col gap-3'>
                                {['Sinhala', 'Tamil', 'English'].map(lang => (
                                    <label key={lang} className='flex items-center gap-3 text-sm text-gray-700'>
                                        <input
                                            type="checkbox"
                                            checked={profileData.languages_spoken?.includes(lang) || false}
                                            onChange={(e) => {
                                                const currentLangs = profileData.languages_spoken || [];
                                                if (e.target.checked) {
                                                    setProfileData({
                                                        ...profileData,
                                                        languages_spoken: [...currentLangs, lang]
                                                    });
                                                } else {
                                                    setProfileData({
                                                        ...profileData,
                                                        languages_spoken: currentLangs.filter(l => l !== lang)
                                                    });
                                                }
                                            }}
                                            className='w-4 h-4 rounded'
                                        />
                                        {lang}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className='flex flex-wrap gap-2'>
                                {profileData.languages_spoken?.map((lang, index) => (
                                    <span key={index} className='px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full'>
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        )}

                        <br />

                        {/* Availability Status & Online Link */}
                        <div>
                            <label className='text-sm font-medium text-gray-600 mb-3 block'>Availability & Online Link</label>

                            {/* Availability Status */}
                            <div className='mb-4'>
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-3 ${profileData.available
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-red-100 text-red-700 border border-red-300'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${profileData.available ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                    {profileData.available ? 'Available' : 'Unavailable'}
                                </div>

                                {isEdit && (
                                    <div className='flex gap-4'>
                                        <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                                            <input
                                                type="radio"
                                                name="availability"
                                                checked={profileData.available === true}
                                                onChange={() => setProfileData({ ...profileData, available: true })}
                                                className='w-4 h-4'
                                            />
                                            Available
                                        </label>
                                        <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                                            <input
                                                type="radio"
                                                name="availability"
                                                checked={profileData.available === false}
                                                onChange={() => setProfileData({ ...profileData, available: false })}
                                                className='w-4 h-4'
                                            />
                                            Unavailable
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Online Link */}
                            <div>
                                <label className='text-xs font-medium text-gray-500 mb-1 block'>Online Consultation Link</label>
                                {isEdit ? (
                                    <input
                                        type="url"
                                        value={profileData.online_link || ''}
                                        onChange={(e) => setProfileData({ ...profileData, online_link: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                        placeholder="https://meet.google.com/..."
                                    />
                                ) : (
                                    <p className='text-xs text-gray-600 break-all'>
                                        {profileData.online_link ? (
                                            <a href={profileData.online_link} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:underline'>
                                                {profileData.online_link}
                                            </a>
                                        ) : 'N/A'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Column - Personal Info */}
                <div className='flex flex-col gap-4'>
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Personal Information</h3>
                        <div className='space-y-3'>
                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Name</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={profileData.name || ''}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-800 font-medium'>{profileData.name}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Email</label>
                                {isEdit ? (
                                    <input
                                        type="email"
                                        value={profileData.email || ''}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.email}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Phone</label>
                                {isEdit ? (
                                    <input
                                        type="tel"
                                        value={profileData.phone || ''}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.phone}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Office Phone</label>
                                {isEdit ? (
                                    <input
                                        type="tel"
                                        value={profileData.office_phone || ''}
                                        onChange={(e) => setProfileData({ ...profileData, office_phone: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.office_phone || 'N/A'}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Gender</label>
                                {isEdit ? (
                                    <select
                                        value={profileData.gender || ''}
                                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.gender}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Date of Birth</label>
                                {isEdit ? (
                                    <input
                                        type="date"
                                        value={profileData.dob || ''}
                                        onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.dob || 'Not Selected'}</p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Third Column - Professional Info */}
                <div className='flex flex-col gap-4'>
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Professional Information</h3>
                        <div className='space-y-3'>
                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Speciality</label>
                                {isEdit ? (
                                    <select
                                        value={profileData.speciality || ''}
                                        onChange={(e) => setProfileData({ ...profileData, speciality: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    >
                                        <option value="Criminal Law">Criminal Law</option>
                                        <option value="Civil Law">Civil Law</option>
                                        <option value="Family Law">Family Law</option>
                                        <option value="Corporate Law">Corporate Law</option>
                                        <option value="Immigration Law">Immigration Law</option>
                                        <option value="Property Law">Property Law</option>
                                        <option value="General Practice">General Practice</option>
                                    </select>
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.speciality}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Degree</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={Array.isArray(profileData.degree) ? profileData.degree.join(', ') : profileData.degree || ''}
                                        onChange={(e) => setProfileData({ ...profileData, degree: e.target.value.split(', ') })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{Array.isArray(profileData.degree) ? profileData.degree.join(', ') : profileData.degree}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>License Number</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={profileData.license_number || ''}
                                        onChange={(e) => setProfileData({ ...profileData, license_number: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.license_number}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Bar Association</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={profileData.bar_association || ''}
                                        onChange={(e) => setProfileData({ ...profileData, bar_association: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.bar_association}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Experience (Years)</label>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        value={profileData.experience || ''}
                                        onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.experience} Years</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Legal Professionals</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={Array.isArray(profileData.legal_professionals) ? profileData.legal_professionals.join(', ') : profileData.legal_professionals || ''}
                                        onChange={(e) => setProfileData({ ...profileData, legal_professionals: e.target.value.split(', ') })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{Array.isArray(profileData.legal_professionals) ? profileData.legal_professionals.join(', ') : profileData.legal_professionals}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Consultation Fees</label>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        value={profileData.fees || ''}
                                        onChange={(e) => setProfileData({ ...profileData, fees: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{currency} {profileData.fees}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Consultation Method</label>
                                {isEdit ? (
                                    <select
                                        value={profileData.method || ''}
                                        onChange={(e) => setProfileData({ ...profileData, method: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    >
                                        <option value="onsite">Onsite</option>
                                        <option value="online">Online</option>
                                        <option value="both">Both</option>
                                    </select>
                                ) : (
                                    <p className='text-sm text-gray-700 capitalize'>{profileData.method}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Location & Courts */}
                <div className='flex flex-col gap-4'>
                    <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1'>
                        <h3 className='text-lg font-semibold text-gray-700 mb-4'>Location & Courts</h3>
                        <div className='space-y-3'>
                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>District</label>
                                {isEdit ? (
                                    <select
                                        value={profileData.district || ''}
                                        onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
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
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.district}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Primary Court</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={profileData.court1 || ''}
                                        onChange={(e) => setProfileData({ ...profileData, court1: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.court1}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Secondary Court</label>
                                {isEdit ? (
                                    <input
                                        type="text"
                                        value={profileData.court2 || ''}
                                        onChange={(e) => setProfileData({ ...profileData, court2: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.court2 || 'N/A'}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Address</label>
                                {isEdit ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Street Address"
                                            value={profileData.address?.street || ''}
                                            onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, street: e.target.value } })}
                                            className='border border-gray-300 rounded w-full p-2 text-sm mb-2'
                                        />
                                        <input
                                            type="text"
                                            placeholder="District"
                                            value={profileData.address?.district || ''}
                                            onChange={(e) => setProfileData({ ...profileData, address: { ...profileData.address, district: e.target.value } })}
                                            className='border border-gray-300 rounded w-full p-2 text-sm'
                                        />
                                    </>
                                ) : (
                                    <p className='text-sm text-gray-700'>
                                        {profileData.address?.street}, {profileData.address?.district}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Latitude</label>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        step="any"
                                        value={profileData.latitude || ''}
                                        onChange={(e) => setProfileData({ ...profileData, latitude: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.latitude}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>Longitude</label>
                                {isEdit ? (
                                    <input
                                        type="number"
                                        step="any"
                                        value={profileData.longitude || ''}
                                        onChange={(e) => setProfileData({ ...profileData, longitude: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.longitude}</p>
                                )}
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-600 mb-1 block'>About</label>
                                {isEdit ? (
                                    <textarea
                                        value={profileData.about || ''}
                                        onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                                        className='border border-gray-300 rounded w-full p-2 text-sm'
                                        rows="4"
                                        placeholder="Tell clients about yourself..."
                                    />
                                ) : (
                                    <p className='text-sm text-gray-700'>{profileData.about}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            {isEdit && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={updateProfile}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        Save All Changes
                    </button>
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
    );
};

export default LawyerProfile;