import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopLawyers = () => {

  const navigate = useNavigate()

  const { lawyers } = useContext(AppContext)

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Top Lawyers to Book</h1>
      <p className='sm:w-1/3 text-center text-sm'>Simply brows through our extensive list of trusted lawyers</p>
      <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
        {lawyers.slice(0, 10).map((item, index) => (
          <div onClick={() => { navigate(`/appointment/${item._id}`); scroll(0, 0) }} className='bg-gradient-to-br from-black to-[#030303]  rounded-2xl p-3 cursor-pointer hover:translate-y-[-5px] transition-all duration-500 shadow-lg hover:shadow-xl' key={index}>
            {/* Profile Image with Availability Badge */}
            <div className="flex justify-center mb-1 relative">
              <div className="w-44 h-44 rounded-full overflow-hidden bg-gray-300">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover aspect-square"
                />
              </div>

              {/* Availability Badge - Top Left */}
              <div className="absolute top-[-2px] left-[-2px] flex items-center gap-1 bg-gray-700 bg-opacity-80 px-1 py-1 rounded-full">
                <div className={`w-2 h-2 ${item.available ? ' bg-green-500 ' : 'bg-red-500'} rounded-full`}></div>
                {/* <span className="text-green-500 text-xs">Available</span>*/}
              </div>
            </div>

            {/* Name */}
            <h2 className="text-white text-lg font-medium text-center mt-[10px] mb-[10px] leading-tight">
              {item.name}
            </h2>

            {/* Specialized Area */}
            <p className="text-gray-300 text-xs text-center mb-0">
              {item.speciality}
            </p>

            {/* District */}
            <p className="text-gray-400 text-xs text-center mb-2">
              {item.district}
            </p>

            {/* View Button  */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/appointment/${item._id}`);
                scroll(0, 0);
              }}
              style={{
                background: 'linear-gradient(to right, #6A0610, #D00C1F)',


              }}

              className="h-[30px] w-full bg-blue-500 hover:bg-blue-600 text-white py-1 rounded-[8px] text-sm font-medium transition-colors"
            >
              View
            </button>


          </div>
        ))}
      </div>
      <button onClick={() => { navigate('/lawyers'); scrollTo(0, 0) }} className='bg-blue-50 text-[#6A0610] px-12 py-3 rounded-full mt-10 hover:scale-105 transition-all'>Show More</button>
    </div >
  )
}

export default TopLawyers