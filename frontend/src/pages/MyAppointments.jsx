import React, { useContext, useEffect, useState } from "react"
import { AppContext } from "../context/AppContext"
import api from "../utils/api"
import { toast } from "react-toastify"
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, CreditCard, XCircle, CheckCircle, ExternalLink, Grid3x3, List, Navigation } from 'lucide-react'

const MyAppointments = () => {
  const { backendUrl, token, getLawyersData } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('card') // 'card' or 'table'
  const itemsPerPage = 4
  const months = [" ", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  const navigate = useNavigate()

  const totalPages = Math.ceil(appointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAppointments = appointments.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getUserAppointments = async () => {
    try {
      const { data } = await api.get('/api/user/appointments')
      if (data.success) {
        setAppointments(data.appointments.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await api.post('/api/user/cancel-appointment', { appointmentId })
      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getLawyersData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await api.post('/api/user/verifyRazorpay', response)
          if (data.success) {
            getUserAppointments()
            navigate('/my-appointments')
          }
        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }
      }
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await api.post('/api/user/payment-razorpay', { appointmentId })
      if (data.success) {
        initPay(data.order)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Function to get Google Maps directions URL
  const getDirectionsUrl = (latitude, longitude) => {
    if (!latitude || !longitude) {
      return null
    }
    // This will open Google Maps with directions from user's current location to the lawyer's office
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
  }

  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token])

  const getStatusBadge = (item) => {
    if (item.isCompleted) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle size={16} className="mr-1" /> Completed
      </span>
    }
    if (item.cancelled) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <XCircle size={16} className="mr-1" /> Cancelled
      </span>
    }
    if (item.payment) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#003C43] text-white">
        <CheckCircle size={16} className="mr-1" /> Paid
      </span>
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
      <Clock size={16} className="mr-1" /> Pending Payment
    </span>
  }

  // Helper function to get lawyer image with fallback
  const getLawyerImage = (lawyerData) => {
    if (lawyerData?.image && lawyerData.image.trim() !== '') {
      return lawyerData.image;
    }
    return 'https://via.placeholder.com/150/cccccc/666666?text=No+Image';
  }

  const renderCardView = () => (
    <div className="space-y-4">
      {currentAppointments.map((item, index) => (
        <div key={index} className="bg-[#e6e6ef] border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Lawyer Image */}
            <div className="flex-shrink-0">
              <img
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover bg-indigo-50"
                src={getLawyerImage(item.lawyerData)}
                alt={item.lawyerData.name}
              />
            </div>

            {/* Appointment Details */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.lawyerData.name}</h3>
                  <p className="text-sm text-gray-600">{item.lawyerData.speciality}</p>
                </div>
                {getStatusBadge(item)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Scheduled Date & Time</p>
                    <p className="text-gray-600">{slotDateFormat(item.slotDate)}</p>
                    <p className="text-gray-600">{item.slotTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{item.lawyerData.address?.street || 'N/A'}</p>
                    <p className="text-gray-600">{item.lawyerData.address?.district || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.consultationType === 'online' ? 'text-blue-500' : 'text-green-500'}`}>
                    {item.consultationType === 'online' ? (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-4.586l-2.707 2.707a1 1 0 01-1.414 0L4.586 13H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Consultation Type</p>
                    <p className="text-gray-600 capitalize">{item.consultationType || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Completed Online Appointment - Meeting Link */}
              {item.isCompleted && item.consultationType === 'online' && item.lawyerData.online_link && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-green-800 mb-2">Your online consultation is ready!</p>
                  <p className="text-xs text-green-700 mb-3">Click the link below to join the meeting with your lawyer</p>
                  <a
                    href={item.lawyerData.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <ExternalLink size={16} />
                    Join Online Meeting
                  </a>
                </div>
              )}

              {/* Completed Onsite Appointment - Directions Link */}
              {item.isCompleted && item.consultationType === 'onsite' && item.lawyerData.latitude && item.lawyerData.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-green-800 mb-2">Your onsite consultation is confirmed!</p>
                  <p className="text-xs text-green-700 mb-2">Visit the lawyer at:</p>
                  <p className="text-sm text-gray-700 mb-3">
                    {item.lawyerData.address?.street && `${item.lawyerData.address.street}, `}
                    {item.lawyerData.address?.district}
                  </p>
                  <a
                    href={getDirectionsUrl(item.lawyerData.latitude, item.lawyerData.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Navigation size={16} />
                    Get Directions
                  </a>
                </div>
              )}

              {/* Action Buttons for Pending Appointments */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!item.cancelled && !item.payment && !item.isCompleted && (
                  <>
                    <button
                      onClick={() => appointmentRazorpay(item._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#003C43] text-white rounded-md hover:bg-[#002a2f] transition-colors text-sm font-medium"
                    >
                      <CreditCard size={16} />
                      Pay Online
                    </button>
                    <button
                      onClick={() => cancelAppointment(item._id)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      <XCircle size={16} />
                      Cancel Appointment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderTableView = () => (
    <div className="overflow-x-auto bg-[#e6e6ef] border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lawyer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speciality</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-[#ececf0] divide-y divide-gray-400">
          {currentAppointments.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full bg-indigo-50 object-cover"
                    src={getLawyerImage(item.lawyerData)}
                    alt=""
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{item.lawyerData.name}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-gray-600">{item.lawyerData.speciality}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-gray-900">{slotDateFormat(item.slotDate)}</p>
                <p className="text-sm text-gray-600">{item.slotTime}</p>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">{item.lawyerData.address?.district || 'N/A'}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  item.consultationType === 'online' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {item.consultationType === 'online' ? 'Online' : 'Onsite'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(item)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {item.isCompleted && item.consultationType === 'online' && item.lawyerData.online_link ? (
                  <a
                    href={item.lawyerData.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium"
                  >
                    <ExternalLink size={14} />
                    Join
                  </a>
                ) : item.isCompleted && item.consultationType === 'onsite' && item.lawyerData.latitude && item.lawyerData.longitude ? (
                  <a
                    href={getDirectionsUrl(item.lawyerData.latitude, item.lawyerData.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium"
                  >
                    <Navigation size={14} />
                    Directions
                  </a>
                ) : !item.cancelled && !item.payment && !item.isCompleted ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => appointmentRazorpay(item._id)}
                      className="text-[#003C43] hover:text-[#002a2f] font-medium"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() => cancelAppointment(item._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track your legal consultations</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'card' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid3x3 size={18} />
            <span className="hidden sm:inline">Card View</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'table' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List size={18} />
            <span className="hidden sm:inline">Table View</span>
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-600">Book a consultation with a lawyer to get started</p>
        </div>
      ) : (
        <>
          {viewMode === 'card' ? renderCardView() : renderTableView()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-gray-50'
                }`}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                    : 'hover:bg-gray-50'
                }`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MyAppointments
