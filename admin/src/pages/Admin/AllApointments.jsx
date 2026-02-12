import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { MdCancel, MdCheckCircle } from 'react-icons/md';

const AllApointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, startDate, endDate]);

  const filteredAppointments = appointments.filter(item => {
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && item.isCompleted) ||
      (filterStatus === 'cancelled' && item.cancelled) ||
      (filterStatus === 'upcoming' && !item.cancelled && !item.isCompleted);

    const matchesSearch = item.userData.name.toLowerCase().includes(searchQuery.toLowerCase());

    const appointmentDate = new Date(item.slotDate);
    const isAfterStart = startDate ? appointmentDate >= new Date(startDate) : true;
    const isBeforeEnd = endDate ? appointmentDate <= new Date(endDate) : true;

    return matchesStatus && matchesSearch && isAfterStart && isBeforeEnd;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      {/* Filters */}
      <div className='flex flex-wrap justify-between items-center gap-4 mb-4'>
        <div className='flex gap-2'>
          <button onClick={() => setFilterStatus('all')} className={`px-4 py-1 rounded-full border ${filterStatus === 'all' ? 'bg-[#6A0610] text-white' : 'text-gray-700'}`}>All</button>
          <button onClick={() => setFilterStatus('completed')} className={`px-4 py-1 rounded-full border ${filterStatus === 'completed' ? 'bg-green-500 text-white' : 'text-gray-700'}`}>Completed</button>
          <button onClick={() => setFilterStatus('cancelled')} className={`px-4 py-1 rounded-full border ${filterStatus === 'cancelled' ? 'bg-red-500 text-white' : 'text-gray-700'}`}>Cancelled</button>
          <button onClick={() => setFilterStatus('upcoming')} className={`px-4 py-1 rounded-full border ${filterStatus === 'upcoming' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>Upcoming</button>
        </div>

        <div className='flex gap-2 items-center'>
          <input
            type='text'
            placeholder='Search by client name'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='px-3 py-1 border rounded-md text-sm text-gray-700'
          />
          <input
            type='date'
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className='px-3 py-1 border rounded-md text-sm text-gray-700 bg-white shadow-sm'
          />
          <input
            type='date'
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className='px-3 py-1 border rounded-md text-sm text-gray-700 bg-white shadow-sm'
          />
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Client Name</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Lawyer</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {currentAppointments.map((item, index) => (
          <div
            className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
            key={index}
          >
            <p className='max-sm:hidden'>{startIndex + index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 h-8 rounded-full object-cover' src={item.userData.image} alt='' />
              <p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 h-8 rounded-full object-cover' src={item.lawyerData.image} alt='' />
              <p>{item.lawyerData.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
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

      {/* Pagination */}
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
    </div>
  );
};

export default AllApointments;