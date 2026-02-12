import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { MdGavel, MdEventNote, MdPeople, MdListAlt, MdCancel, MdCheckCircle } from 'react-icons/md';

const Dashboard = () => {
    const { aToken, getDashData, cancelAppointment, dashData } = useContext(AdminContext);
    const { slotDateFormat } = useContext(AppContext);

    useEffect(() => {
        if (aToken) {
            getDashData();
        }
    }, [aToken]);

    return (
        dashData && (
            <div className='m-5'>
                <div className='flex flex-wrap gap-3'>
                    <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                        <MdGavel className='text-[#6A0610]' size={56} />
                        <div>
                            <p className='text-xl font-semibold text-gray-600'>{dashData.lawyers}</p>
                            <p className='text-gray-400'>Lawyers</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                        <MdEventNote className='text-[#D00C1F]' size={56} />
                        <div>
                            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
                            <p className='text-gray-400'>Appointments</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
                        <MdPeople className='text-[#030303]' size={56} />
                        <div>
                            <p className='text-xl font-semibold text-gray-600'>{dashData.clients}</p>
                            <p className='text-gray-400'>Clients</p>
                        </div>
                    </div>
                </div>

                <div className='bg-white'>
                    <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border'>
                        <MdListAlt className='text-[#6A0610]' size={24} />
                        <p className='font-semibold'>Latest Bookings</p>
                    </div>

                    <div className='pt-4 border border-t-0'>
                        {dashData.latestAppointments.map((item, index) => (
                            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
                                <img
                                    className='w-10 h-10 rounded-full object-cover'
                                    src={item.lawyerData.image}
                                    alt=''
                                />
                                <div className='flex-1 text-sm'>
                                    <p className='text-gray-800 font-medium'>{item.lawyerData.name}</p>
                                    <p className='text-gray-600'>{slotDateFormat(item.slotDate)}</p>
                                </div>
                                {item.cancelled ? (
                                    <p className='text-red-400 text-xs font-medium flex items-center gap-1'>
                                        <MdCancel size={16} /> Cancelled
                                    </p>
                                ) : item.isCompleted ? (
                                    <p className='text-green-500 text-xs font-medium flex items-center gap-1'>
                                        <MdCheckCircle size={16} /> Completed
                                    </p>
                                ) : (
                                    <MdCancel
                                        onClick={() => cancelAppointment(item._id)}
                                        className='text-red-500 cursor-pointer'
                                        size={24}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    );
};

export default Dashboard;