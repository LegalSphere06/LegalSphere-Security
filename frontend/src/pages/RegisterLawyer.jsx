import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Mail, GraduationCap, MapPin, Scale, FileText, Camera, Upload, MapPinned } from 'lucide-react';
import api from '../utils/api';
import { sanitizeInput } from '../utils/sanitize';
import { toast } from 'react-toastify';

const RegisterLawyer = () => {
    // Password validation configuration
    const PASSWORD_MIN_LENGTH = 8;
    const PASSWORD_VALIDATION_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    const PASSWORD_MISMATCH_MESSAGE = 'Passwords do not match';

    // OTP state variables
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        application_name: '',
        application_email: '',
        application_password: '',
        application_phone: '',
        application_office_phone: '',
        application_speciality: '',
        application_gender: '',
        application_dob: '',
        application_degree: [],
        application_district: '',
        application_license_number: '',
        application_bar_association: '',
        application_experience: '',
        application_languages_spoken: [],
        application_about: '',
        application_legal_professionals: [],
        application_fees: 0,
        application_address: {},
        application_latitude: 0,
        application_longitude: 0,
        application_court1: '',
        application_court2: '',
        application_image: null,
        application_license_certificate: null,
        application_birth_certificate: null,
        application_legal_professionals_certificate: []
    });

    const specialities = [
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
    ];

    const degrees = [
        'Attorney-at-Law (Sri Lanka Law College)',
        'LL.B (University of Colombo)',
        'LL.B (University of Peradeniya)',
        'LL.B (University of Jaffna)',
        'LL.B (University of Ruhuna)',
        'LL.B (Eastern University)',
        'LL.B (South Eastern University)',
        'LL.B (Open University of Sri Lanka)',
        'LL.B (General Sir John Kotelawala Defence University)',
        'LL.B (University of Sri Jayewardenepura)',
        'LL.M (Master of Laws)',
        'PhD in Law',
        'Diploma in Law',
        'Other'
    ];

    const districts = [
        'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
        'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
        'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
        'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
        'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
    ];

    const steps = [
        { id: 'personal', title: 'Personal Info', icon: User },
        { id: 'contact', title: 'Contact Details', icon: Mail },
        { id: 'education', title: 'Education', icon: GraduationCap },
        { id: 'professional', title: 'Professional', icon: Scale },
        { id: 'location', title: 'Location', icon: MapPin },
        { id: 'documents', title: 'Documents', icon: FileText },
        { id: 'review', title: 'Review', icon: Camera }
    ];

    // Live validation
    useEffect(() => {
        validateCurrentStep();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, passwordConfirm, currentStep]);

    // Validation helper functions
    const validatePersonalInfo = (errors) => {
        if (formData.application_name && formData.application_name.length < 3) {
            errors.name = 'Name must be at least 3 characters';
        }
        if (formData.application_dob) {
            const dobYear = new Date(formData.application_dob).getFullYear();
            if (dobYear >= 2000) {
                errors.dob = 'Must be born before 2000';
            }
        }
    };

    const validateContactDetails = (errors) => {
        if (formData.application_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.application_email)) {
            errors.email = 'Invalid email format';
        }
        if (formData.application_password && formData.application_password.length < PASSWORD_MIN_LENGTH) {
            errors.password = PASSWORD_VALIDATION_MESSAGE;
        }
        if (passwordConfirm && formData.application_password !== passwordConfirm) {
            errors.passwordConfirm = PASSWORD_MISMATCH_MESSAGE;
        }
        if (formData.application_phone && !/^(?:\+94|0)?7\d{8}$/.test(formData.application_phone.replaceAll(/\s/g, ''))) {
            errors.phone = 'Invalid Sri Lankan mobile number';
        }
        if (formData.application_office_phone && formData.application_office_phone.length > 0 &&
            !/^(?:\+94|0)?(?:[1-9]1|2[1-7]|3[1-8]|4[157]|5[1-7]|6[1-7]|[78]1)\d{7}$/.test(formData.application_office_phone.replaceAll(/\s/g, ''))) {
            errors.officePhone = 'Invalid Sri Lankan landline number';
        }
    };

    const validateCurrentStep = () => {
        const newErrors = {};

        switch (currentStep) {
            case 0: // Personal Info
                validatePersonalInfo(newErrors);
                break;

            case 1: // Contact Details
                validateContactDetails(newErrors);
                break;

            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLanguageToggle = (language) => {
        setFormData(prev => ({
            ...prev,
            application_languages_spoken: prev.application_languages_spoken.includes(language)
                ? prev.application_languages_spoken.filter(l => l !== language)
                : [...prev.application_languages_spoken, language]
        }));
    };

    const handleDegreeToggle = (degree) => {
        setFormData(prev => ({
            ...prev,
            application_degree: prev.application_degree.includes(degree)
                ? prev.application_degree.filter(d => d !== degree)
                : [...prev.application_degree, degree]
        }));
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    handleInputChange('application_latitude', position.coords.latitude);
                    handleInputChange('application_longitude', position.coords.longitude);
                    toast.success('Location captured successfully!');
                },
                () => {
                    toast.error('Unable to get location. Please enter manually.');
                }
            );
        } else {
            toast.error('Geolocation is not supported by your browser');
        }
    };

    const formatPhoneNumber = (value) => {
        const cleaned = value.replaceAll(/\D/g, '');
        if (cleaned.startsWith('94')) {
            return `+94 ${cleaned.slice(2).replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')}`;
        }
        if (cleaned.startsWith('0')) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        return value;
    };

    const handleFileChange = (field, file) => {
        setFormData(prev => ({
            ...prev,
            [field]: file
        }));
    };

    const handleMultipleFileChange = (field, files) => {
        setFormData(prev => ({
            ...prev,
            [field]: Array.from(files)
        }));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToStep = (stepIndex) => {
        setCurrentStep(stepIndex);
    };

    const validateForm = () => {
        const requiredFields = [
            'application_name',
            'application_email',
            'application_password',
            'application_phone',
            'application_speciality',
            'application_gender',
            'application_license_number',
            'application_bar_association',
            'application_experience',
            'application_district',
            'application_court1'
        ];

        for (const field of requiredFields) {
            if (!formData[field] || formData[field] === '') {
                toast.error(`Please fill in ${field.replace('application_', '').replaceAll('_', ' ')}`);
                return false;
            }
        }

        if (!formData.application_password || formData.application_password.length < PASSWORD_MIN_LENGTH) {
            toast.error(PASSWORD_VALIDATION_MESSAGE);
            return false;
        }

        if (formData.application_password !== passwordConfirm) {
            toast.error(PASSWORD_MISMATCH_MESSAGE);
            return false;
        }

        if (formData.application_languages_spoken.length === 0) {
            toast.error('Please select at least one language');
            return false;
        }

        if (formData.application_degree.length === 0) {
            toast.error('Please select at least one degree');
            return false;
        }

        if (formData.application_legal_professionals.length === 0) {
            toast.error('Please provide legal professional information');
            return false;
        }

        return true;
    };

    // OTP FUNCTIONS
    const handleSendOTP = async () => {
        if (!formData.application_email) {
            toast.error('Please enter your email address first');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.application_email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            setIsSendingOTP(true);
            const response = await api.post('/api/application/send-otp', {
                email: sanitizeInput(formData.application_email)
            });

            if (response.data.success) {
                setOtpSent(true);
                toast.success('OTP sent to your email!');
            } else {
                toast.error(response.data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('OTP send error:', error);
            toast.error('Failed to send OTP. Please try again.');
        } finally {
            setIsSendingOTP(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpValue || otpValue.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setIsVerifyingOTP(true);
            const response = await api.post('/api/application/verify-otp', {
                email: sanitizeInput(formData.application_email),
                otp: otpValue
            });

            if (response.data.success) {
                setOtpVerified(true);
                toast.success('Email verified successfully!');
            } else {
                toast.error(response.data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast.error('Failed to verify OTP. Please try again.');
        } finally {
            setIsVerifyingOTP(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            // Validate form
            if (!validateForm()) {
                setIsSubmitting(false);
                return;
            }

            // Create FormData for file uploads
            const submitData = new FormData();

            // Add text fields (sanitized)
            submitData.append('application_name', sanitizeInput(formData.application_name));
            submitData.append('application_email', sanitizeInput(formData.application_email));
            submitData.append('application_password', formData.application_password);
            submitData.append('application_phone', sanitizeInput(formData.application_phone));
            submitData.append('application_office_phone', sanitizeInput(formData.application_office_phone));
            submitData.append('application_speciality', formData.application_speciality);
            submitData.append('application_gender', formData.application_gender);
            submitData.append('application_dob', formData.application_dob);
            submitData.append('application_degree', JSON.stringify(formData.application_degree));
            submitData.append('application_district', formData.application_district);
            submitData.append('application_license_number', sanitizeInput(formData.application_license_number));
            submitData.append('application_bar_association', sanitizeInput(formData.application_bar_association));
            submitData.append('application_experience', formData.application_experience);
            submitData.append('application_languages_spoken', JSON.stringify(formData.application_languages_spoken));
            submitData.append('application_about', sanitizeInput(formData.application_about));
            submitData.append('application_legal_professionals', JSON.stringify(formData.application_legal_professionals));
            submitData.append('application_fees', formData.application_fees.toString());
            submitData.append('application_address', JSON.stringify({
                line1: sanitizeInput(formData.application_address?.line1 || ''),
                line2: sanitizeInput(formData.application_address?.line2 || '')
            }));
            submitData.append('application_latitude', formData.application_latitude.toString());
            submitData.append('application_longitude', formData.application_longitude.toString());
            submitData.append('application_court1', sanitizeInput(formData.application_court1));
            submitData.append('application_court2', sanitizeInput(formData.application_court2));

            // Add files
            if (formData.application_image) {
                submitData.append('application_image', formData.application_image);
            }
            if (formData.application_license_certificate) {
                submitData.append('application_license_certificate', formData.application_license_certificate);
            }
            if (formData.application_birth_certificate) {
                submitData.append('application_birth_certificate', formData.application_birth_certificate);
            }
            if (formData.application_legal_professionals_certificate.length > 0) {
                formData.application_legal_professionals_certificate.forEach((file) => {
                    submitData.append('application_legal_professionals_certificate', file);
                });
            }

            // Submit to backend
            const response = await api.post('/api/application/add-application', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                toast.success('Application submitted successfully! You will be notified once it\'s reviewed.');

                // Reset form
                setFormData({
                    application_name: '',
                    application_email: '',
                    application_password: '',
                    application_phone: '',
                    application_office_phone: '',
                    application_speciality: '',
                    application_gender: '',
                    application_dob: '',
                    application_degree: [],
                    application_district: '',
                    application_license_number: '',
                    application_bar_association: '',
                    application_experience: '',
                    application_languages_spoken: [],
                    application_about: '',
                    application_legal_professionals: [],
                    application_fees: 0,
                    application_address: {},
                    application_latitude: 0,
                    application_longitude: 0,
                    application_court1: '',
                    application_court2: '',
                    application_image: null,
                    application_license_certificate: null,
                    application_birth_certificate: null,
                    application_legal_professionals_certificate: []
                });
                setPasswordConfirm('');
                setCurrentStep(0);
                // Reset OTP states
                setOtpSent(false);
                setOtpVerified(false);
                setOtpValue('');
            } else {
                toast.error(response.data.message || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-3 mt-3 overflow-x-auto pb-4">
            <div className="flex items-center space-x-2 min-w-max">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                type="button"
                                className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'
                                    }`}
                                onClick={() => goToStep(index)}
                                aria-label={`Go to step ${index + 1}: ${step.title}`}
                            >
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md border-blue-600'
                                        : isCompleted
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                                    }
                                `}>
                                    <Icon size={20} />
                                </div>
                                <span className={`
                                    text-xs mt-2 font-medium transition-colors duration-300
                                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-gray-600'}
                                `}>
                                    {step.title}
                                </span>
                            </button>
                            {index < steps.length - 1 && (
                                <div className={`
                                    w-8 h-0.5 mx-2 transition-colors duration-300
                                    ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}
                                `} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );

    const renderPersonalInfo = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                        id="full-name"
                        type="text"
                        value={formData.application_name}
                        onChange={(e) => handleInputChange('application_name', e.target.value)}
                        className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                        placeholder="Enter your full name"
                        required
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                    <select
                        id="gender"
                        value={formData.application_gender}
                        onChange={(e) => handleInputChange('application_gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth (Must be before 2000)</label>
                    <input
                        id="dob"
                        type="date"
                        value={formData.application_dob}
                        onChange={(e) => handleInputChange('application_dob', e.target.value)}
                        max="1999-12-31"
                        className={`w-full px-3 py-2 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                </div>
                <div>
                    <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-2">Speciality *</label>
                    <select
                        id="speciality"
                        value={formData.application_speciality}
                        onChange={(e) => handleInputChange('application_speciality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                    >
                        <option value="">Select Speciality</option>
                        {specialities.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">About Yourself</label>
                <textarea
                    id="about"
                    value={formData.application_about}
                    onChange={(e) => handleInputChange('application_about', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Brief description about yourself and your practice"
                />
            </div>
        </div>
    );

    const renderContactDetails = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                        id="email"
                        type="email"
                        value={formData.application_email}
                        onChange={(e) => handleInputChange('application_email', e.target.value)}
                        className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                        placeholder="your.email@example.com"
                        required
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                        id="password"
                        type="password"
                        value={formData.application_password}
                        onChange={(e) => handleInputChange('application_password', e.target.value)}
                        className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                        placeholder="Enter your password (min 8 characters)"
                        required
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                    <input
                        id="password-confirm"
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className={`w-full px-3 py-2 border ${errors.passwordConfirm ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                        placeholder="Re-enter your password"
                        required
                    />
                    {errors.passwordConfirm && <p className="text-red-500 text-xs mt-1">{errors.passwordConfirm}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                        <input
                            id="mobile"
                            type="tel"
                            value={formData.application_phone}
                            onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                handleInputChange('application_phone', formatted);
                            }}
                            className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                            placeholder="077 123 4567"
                            required
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                        <label htmlFor="office-phone" className="block text-sm font-medium text-gray-700 mb-2">Office Phone</label>
                        <input
                            id="office-phone"
                            type="tel"
                            value={formData.application_office_phone}
                            onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                handleInputChange('application_office_phone', formatted);
                            }}
                            className={`w-full px-3 py-2 border ${errors.officePhone ? 'border-red-500' : 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                            placeholder="011 234 5678"
                        />
                        {errors.officePhone && <p className="text-red-500 text-xs mt-1">{errors.officePhone}</p>}
                    </div>
                </div>
            </div>

            <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-3">Languages Spoken *</legend>
                <div className="flex gap-6">
                    {['Sinhala', 'Tamil', 'English'].map(language => (
                        <label key={language} htmlFor={`lang-${language}`} className="flex items-center cursor-pointer">
                            <input
                                id={`lang-${language}`}
                                type="checkbox"
                                checked={formData.application_languages_spoken.includes(language)}
                                onChange={() => handleLanguageToggle(language)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700">{language}</span>
                        </label>
                    ))}
                </div>
                {formData.application_languages_spoken.length === 0 && (
                    <p className="text-gray-500 text-xs mt-1">Please select at least one language</p>
                )}
            </fieldset>
        </div>
    );

    const renderEducation = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Education & Qualifications</h2>
            <div className="space-y-6">
                <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-3">Degrees & Qualifications *</legend>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                        {degrees.map(degree => (
                            <label key={degree} htmlFor={`degree-${degree}`} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                    id={`degree-${degree}`}
                                    type="checkbox"
                                    checked={formData.application_degree.includes(degree)}
                                    onChange={() => handleDegreeToggle(degree)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-700">{degree}</span>
                            </label>
                        ))}
                    </div>
                    {formData.application_degree.length === 0 && (
                        <p className="text-gray-500 text-xs mt-1">Please select at least one degree</p>
                    )}
                </fieldset>

                <div>
                    <label htmlFor="legal-professionals" className="block text-sm font-medium text-gray-700 mb-2">Legal Professionals Information *</label>
                    <textarea
                        id="legal-professionals"
                        value={formData.application_legal_professionals.join('\n')}
                        onChange={(e) => handleInputChange('application_legal_professionals', e.target.value.split('\n').filter(item => item.trim()))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Enter professional details (one per line)"
                        required
                    />
                </div>
            </div>
        </div>
    );

    const renderProfessional = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Professional Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="license-number" className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                        id="license-number"
                        type="text"
                        value={formData.application_license_number}
                        onChange={(e) => handleInputChange('application_license_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your license number"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="bar-association" className="block text-sm font-medium text-gray-700 mb-2">Bar Association *</label>
                    <input
                        id="bar-association"
                        type="text"
                        value={formData.application_bar_association}
                        onChange={(e) => handleInputChange('application_bar_association', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="e.g., Bar Association of Sri Lanka"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                    <input
                        id="experience"
                        type="text"
                        value={formData.application_experience}
                        onChange={(e) => handleInputChange('application_experience', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="e.g., 5-10 years"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-2">Consultation Fees (LKR)</label>
                    <input
                        id="fees"
                        type="number"
                        value={formData.application_fees}
                        onChange={(e) => handleInputChange('application_fees', Number.parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter consultation fees"
                        min="0"
                    />
                </div>
                <div>
                    <label htmlFor="court1" className="block text-sm font-medium text-gray-700 mb-2">Primary Court *</label>
                    <input
                        id="court1"
                        type="text"
                        value={formData.application_court1}
                        onChange={(e) => handleInputChange('application_court1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Primary court of practice"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="court2" className="block text-sm font-medium text-gray-700 mb-2">Secondary Court</label>
                    <input
                        id="court2"
                        type="text"
                        value={formData.application_court2}
                        onChange={(e) => handleInputChange('application_court2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Secondary court of practice"
                    />
                </div>
            </div>
        </div>
    );

    const renderLocation = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Location & Address</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                    <select
                        id="district"
                        value={formData.application_district}
                        onChange={(e) => handleInputChange('application_district', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        required
                    >
                        <option value="">Select District</option>
                        {districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Complete Address *</label>
                    <textarea
                        id="address"
                        value={typeof formData.application_address === 'string' ? formData.application_address : formData.application_address.street || ''}
                        onChange={(e) => handleInputChange('application_address', { street: e.target.value, district: formData.application_district })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        placeholder="Enter your complete office address"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.application_latitude}
                        onChange={(e) => handleInputChange('application_latitude', Number.parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter latitude"
                    />
                </div>
                <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.application_longitude}
                        onChange={(e) => handleInputChange('application_longitude', Number.parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter longitude"
                    />
                </div>

                <div className="md:col-span-2">
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200"
                    >
                        <MapPinned size={20} />
                        Get Current Location (My Office)
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Click to automatically fill latitude and longitude of your office location</p>
                </div>
            </div>
        </div>
    );

    const renderDocuments = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Document Upload (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
                Document uploads are optional but recommended. You can submit your application now and upload documents later if needed.
            </p>
            <div className="space-y-6">
                <div className="border border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors duration-200">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Profile Picture (Optional)</h3>
                    <p className="mt-1 text-sm text-gray-600">Upload your professional photo</p>
                    <label htmlFor="profile-pic" className="sr-only">Profile Picture</label>
                    <input
                        id="profile-pic"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('application_image', e.target.files?.[0] || null)}
                        className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    {formData.application_image && (
                        <p className="mt-1 text-sm text-green-600">✓ {formData.application_image.name}</p>
                    )}
                </div>

                <div className="border border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors duration-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">License Certificate (Optional)</h3>
                    <p className="mt-1 text-sm text-gray-600">Upload your law license certificate</p>
                    <label htmlFor="license-cert" className="sr-only">License Certificate</label>
                    <input
                        id="license-cert"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('application_license_certificate', e.target.files?.[0] || null)}
                        className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    {formData.application_license_certificate && (
                        <p className="mt-1 text-sm text-green-600">✓ {formData.application_license_certificate.name}</p>
                    )}
                </div>

                <div className="border border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors duration-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Birth Certificate (Optional)</h3>
                    <p className="mt-1 text-sm text-gray-600">Upload your birth certificate</p>
                    <label htmlFor="birth-cert" className="sr-only">Birth Certificate</label>
                    <input
                        id="birth-cert"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange('application_birth_certificate', e.target.files?.[0] || null)}
                        className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    {formData.application_birth_certificate && (
                        <p className="mt-1 text-sm text-green-600">✓ {formData.application_birth_certificate.name}</p>
                    )}
                </div>

                <div className="border border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors duration-200">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Professional Certificates (Optional)</h3>
                    <p className="mt-1 text-sm text-gray-600">Upload additional professional certificates</p>
                    <label htmlFor="prof-certs" className="sr-only">Professional Certificates</label>
                    <input
                        id="prof-certs"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        multiple
                        onChange={(e) => handleMultipleFileChange('application_legal_professionals_certificate', e.target.files || [])}
                        className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    {formData.application_legal_professionals_certificate.length > 0 && (
                        <p className="mt-1 text-sm text-green-600">
                            ✓ {formData.application_legal_professionals_certificate.length} file(s) selected
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderReview = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review & Submit</h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Name:</span>
                        <span className="text-gray-900">{formData.application_name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Email:</span>
                        <span className="text-gray-900">{formData.application_email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Phone:</span>
                        <span className="text-gray-900">{formData.application_phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Speciality:</span>
                        <span className="text-gray-900">{formData.application_speciality || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Experience:</span>
                        <span className="text-gray-900">{formData.application_experience || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">District:</span>
                        <span className="text-gray-900">{formData.application_district || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Languages:</span>
                        <span className="text-gray-900">{formData.application_languages_spoken.join(', ') || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">License Number:</span>
                        <span className="text-gray-900">{formData.application_license_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Degrees:</span>
                        <span className="text-gray-900 text-right">{formData.application_degree.join(', ') || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-medium text-gray-600">Bar Association:</span>
                        <span className="text-gray-900">{formData.application_bar_association || 'Not provided'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Please Review Your Information</h4>
                <p className="text-sm text-yellow-700">
                    Once submitted, your application will be reviewed by our admin team. Please ensure all information is accurate before proceeding.
                </p>
            </div>

            {/* OTP Verification Section */}
            <div className="mt-6 border border-blue-200 rounded-lg p-6 bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-4">Email Verification Required</h4>

                {!otpSent ? (
                    <div>
                        <p className="text-sm text-blue-700 mb-4">
                            Please verify your email address before submitting the application.
                        </p>
                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={isSendingOTP}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSendingOTP ? 'Sending OTP...' : 'Send OTP to Email'}
                        </button>
                    </div>
                ) : otpVerified ? (

                    <div className="text-center">
                        <p className="text-green-700 font-medium mb-2">✓ Email Verified Successfully!</p>
                        <p className="text-sm text-green-600">You can now submit your application.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-blue-700">
                            Enter the 6-digit code sent to <strong>{formData.application_email}</strong>
                        </p>
                        <label htmlFor="otp-input" className="sr-only">Enter OTP</label>
                        <input
                            id="otp-input"
                            type="text"
                            maxLength={6}
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                        />
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleVerifyOTP}
                                disabled={isVerifyingOTP || otpValue.length !== 6}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isVerifyingOTP ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtpValue('');
                                }}
                                className="px-6 py-3 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 transition-all duration-200"
                            >
                                Resend OTP
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderPersonalInfo();
            case 1: return renderContactDetails();
            case 2: return renderEducation();
            case 3: return renderProfessional();
            case 4: return renderLocation();
            case 5: return renderDocuments();
            case 6: return renderReview();
            default: return renderPersonalInfo();
        }
    };

    return (
        <div className='mt-8'>
            <div className="max-w-4xl mx-auto">
                <div className="bg-[#e6e6ef] rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <div
                        style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
                        className=" px-4 py-2">
                        <h1 className="text-2xl font-bold text-white">Lawyer Registration</h1>
                        <p className="text-blue-100 mt-2">Complete your professional registration</p>
                    </div>

                    <div className="p-8">
                        {renderStepIndicator()}

                        <div className="min-h-[400px]">
                            {renderCurrentStep()}
                        </div>

                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 0 || isSubmitting}
                                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${currentStep === 0 || isSubmitting
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <ChevronLeft size={20} className="mr-2" />
                                Previous
                            </button>

                            {currentStep < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isSubmitting}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                    <ChevronRight size={20} className="ml-2" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !otpVerified}
                                    className={`flex items-center px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${otpVerified
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        } disabled:opacity-50`}
                                >
                                    {isSubmitting ? 'Submitting...' : !otpVerified ? 'Verify Email First' : 'Submit Application'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterLawyer;
