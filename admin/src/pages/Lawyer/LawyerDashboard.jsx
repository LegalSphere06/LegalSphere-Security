import React, { useContext, useEffect, useState } from 'react';
import { LawyerContext } from '../../context/LawyerContext';
import { AppContext } from '../../context/AppContext';
import { MdCancel, MdCheckCircle, MdAttachMoney, MdEventNote, MdPeople, MdListAlt, MdLink, MdEdit } from 'react-icons/md';
import { toast } from 'react-toastify';

const LawyerDashboard = () => {
    const { dToken, dashData, getDashData, completeAppointment, cancelAppointment, profileData, getProfileData, updateOnlineLink } = useContext(LawyerContext);
    const { currency, slotDateFormat } = useContext(AppContext);
    
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [onlineLink, setOnlineLink] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (dToken) {
            getDashData();
            getProfileData();
        }
    }, [dToken]);

    useEffect(() => {
        if (profileData) {
            setOnlineLink(profileData.online_link || '');
        }
    }, [profileData]);

    const handleUpdateLink = async () => {
        if (!onlineLink.trim()) {
            toast.error('Please enter a valid link');
            return;
        }

        // Basic URL validation
        try {
            new URL(onlineLink);
        } catch {
            toast.error('Please enter a valid URL (e.g., https://meet.google.com/xxx)');
            return;
        }

        setIsUpdating(true);
        const success = await updateOnlineLink(onlineLink);
        setIsUpdating(false);

        if (success) {
            setShowLinkModal(false);
            getProfileData(); // Refresh profile data
        }
    };

    const handleOpenLink = () => {
        if (onlineLink) {
            window.open(onlineLink, '_blank', 'noopener,noreferrer');
        }
    };

    return dashData && (
        <div className='m-5'>
            <div className='flex flex-wrap gap-3'>
                {/* Earnings Card */}
                <div className='flex flex-col items-center justify-center bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <MdAttachMoney className='text-[#6A0610]' size={56} />
                    <p className='text-xl font-semibold text-gray-600 mt-2'>{currency}{dashData.earnings}</p>
                    <p className='text-gray-400 text-sm'>Earnings</p>
                </div>

                {/* Appointments Card */}
                <div className='flex flex-col items-center justify-center bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <MdEventNote className='text-[#D00C1F]' size={56} />
                    <p className='text-xl font-semibold text-gray-600 mt-2'>{dashData.appointments}</p>
                    <p className='text-gray-400 text-sm'>Appointments</p>
                </div>

                {/* Clients Card */}
                <div className='flex flex-col items-center justify-center bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                    <MdPeople className='text-[#030303]' size={56} />
                    <p className='text-xl font-semibold text-gray-600 mt-2'>{dashData.clients}</p>
                    <p className='text-gray-400 text-sm'>Clients</p>
                </div>

                {/* Online Meeting Link Card */}
                <div className='flex-1 min-w-[280px] bg-gradient-to-br from-[#43256f] to-[#6A0610] p-4 rounded border-2 border-gray-100 text-white shadow-lg'>
                    <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                            <MdLink size={32} />
                            <div>
                                <p className='font-semibold text-lg'>Online Meeting Link</p>
                                <p className='text-xs text-gray-200'>For virtual consultations</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className='bg-white text-[#321469] p-2 rounded-full hover:bg-gray-100 transition-all shadow-md'
                            title={onlineLink ? 'Update Link' : 'Add Link'}
                        >
                            <MdEdit size={20} />
                        </button>
                    </div>
                    
                    {onlineLink ? (
                        <div className='mt-2'>
                            <p className='text-xs text-gray-200 mb-2'>Current Link:</p>
                            <div className='bg-white/20 backdrop-blur-sm p-3 rounded text-sm break-all mb-3 max-h-20 overflow-y-auto'>
                                {onlineLink}
                            </div>
                            <button
                                onClick={handleOpenLink}
                                className='w-full bg-white text-[#056d0c] py-2 px-4 rounded font-medium hover:bg-gray-100 transition-all shadow-md flex items-center justify-center gap-2'
                            >
                                <MdLink size={18} />
                                Open Meeting Link
                            </button>
                        </div>
                    ) : (
                        <div className='mt-2'>
                            <p className='text-sm text-gray-200 mb-3'>No link set yet. Add your meeting link for online consultations.</p>
                            <button
                                onClick={() => setShowLinkModal(true)}
                                className='w-full bg-white text-[#D00C1F] py-2 px-4 rounded font-medium hover:bg-gray-100 transition-all shadow-md flex items-center justify-center gap-2'
                            >
                                <MdLink size={18} />
                                Add Meeting Link
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Latest Bookings Section */}
            <div className='bg-white mt-10 rounded-lg shadow-sm'>
                <div className='flex items-center gap-2.5 px-4 py-4 rounded-t border-b bg-gray-50'>
                    <MdListAlt className='text-[#6A0610]' size={24} />
                    <p className='font-semibold text-gray-800'>Latest Bookings</p>
                </div>

                <div className='divide-y'>
                    {dashData.latestAppointments && dashData.latestAppointments.length > 0 ? (
                        dashData.latestAppointments.map((item, index) => (
                            <div className='flex items-center px-6 py-4 gap-3 hover:bg-gray-50 transition-colors' key={index}>
                                <img 
                                    className='w-12 h-12 rounded-full object-cover border-2 border-gray-200' 
                                    src={item.userData?.image || '/default-avatar.png'} 
                                    alt={item.userData?.name || 'Client'} 
                                />
                                <div className='flex-1 text-sm'>
                                    <p className='text-gray-800 font-semibold'>{item.userData?.name || 'Client'}</p>
                                    <p className='text-gray-600 text-xs'>{slotDateFormat(item.slotDate)} at {item.slotTime}</p>
                                </div>
                                {item.cancelled ? (
                                    <p className='text-red-500 text-xs font-medium flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full'>
                                        <MdCancel size={16} /> Cancelled
                                    </p>
                                ) : item.isCompleted ? (
                                    <p className='text-green-600 text-xs font-medium flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full'>
                                        <MdCheckCircle size={16} /> Completed
                                    </p>
                                ) : (
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={() => cancelAppointment(item._id)}
                                            className='p-2 hover:bg-red-50 rounded-full transition-all'
                                            title='Cancel Appointment'
                                        >
                                            <MdCancel className='text-red-500 cursor-pointer' size={24} />
                                        </button>
                                        <button
                                            onClick={() => completeAppointment(item._id)}
                                            className='p-2 hover:bg-green-50 rounded-full transition-all'
                                            title='Mark as Completed'
                                        >
                                            <MdCheckCircle className='text-green-500 cursor-pointer' size={24} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className='px-6 py-8 text-center text-gray-500'>
                            <MdEventNote size={48} className='mx-auto mb-2 text-gray-300' />
                            <p>No appointments yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Adding/Updating Link */}
            {showLinkModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-lg p-6 max-w-md w-full shadow-2xl animate-fadeIn'>
                        <div className='flex items-center gap-3 mb-4'>
                            <div className='bg-[#6c38dc] p-3 rounded-full'>
                                <MdLink className='text-white' size={24} />
                            </div>
                            <h3 className='text-xl font-semibold text-gray-800'>
                                {onlineLink ? 'Update' : 'Add'} Meeting Link
                            </h3>
                        </div>
                        
                        <p className='text-sm text-gray-600 mb-4'>
                            Add your Google Meet, Zoom, Microsoft Teams, or other video conferencing link for online consultations with clients.
                        </p>
                        
                        <div className='mb-4'>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Meeting Link URL
                            </label>
                            <input
                                type='url'
                                value={onlineLink}
                                onChange={(e) => setOnlineLink(e.target.value)}
                                placeholder='https://meet.google.com/xxx-xxxx-xxx'
                                className='w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#D00C1F] focus:border-transparent transition-all'
                            />
                        </div>

                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
                            <p className='text-xs text-blue-800'>
                                💡 <strong>Tip:</strong> Make sure your link is accessible to anyone with the URL for seamless client connections.
                            </p>
                        </div>
                        
                        <div className='flex gap-3'>
                            <button
                                onClick={() => {
                                    setShowLinkModal(false);
                                    setOnlineLink(profileData?.online_link || ''); // Reset to original
                                }}
                                className='flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-all font-medium'
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateLink}
                                disabled={isUpdating}
                                className='flex-1 bg-[#616baf] text-white py-2.5 rounded-lg hover:bg-[#261069] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2'
                            >
                                {isUpdating ? (
                                    <>
                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <MdCheckCircle size={18} />
                                        Save Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerDashboard;