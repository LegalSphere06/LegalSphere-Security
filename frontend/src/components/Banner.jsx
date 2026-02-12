import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Banner = () => {
  const navigate = useNavigate()

  return (
    <div className='flex rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10'
      style={{ background: 'linear-gradient(to right, #6A0610, #D00C1F)' }}
    >
      {/* -----------------Left Side ----------------*/}
      <div className='flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5'>
        <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl text-white font-medium leading-tight mb-6'>
          Book Appointment <br />
          With Trusted Lawyers
        </div>
        <div className='text-white text-sm md:text-base mb-8'>
          Simply browse through our extensive list of trusted lawyers, <br className='hidden sm:block' />
          schedule your appointment hassle-free.
        </div>

        {/* Method 1: Image inside button */}
        <button
          onClick={() => { navigate('/lawyers'); scrollTo(0, 0) }}
          className='flex items-center gap-3 bg-white px-8 py-3 rounded-full text-[#6A0610] text-sm md:text-base hover:scale-105 transition-all duration-300'
        >
          <img
            src={assets.appointment_img}
            alt="appointment"
            className='w-6 h-6 object-contain'
          />
          Book appointment
        </button>

        {/* Method 2: Button with background image */}
        {/* <button 
          onClick={() => { navigate('/lawyers'); scrollTo(0, 0) }} 
          className='relative bg-white px-12 py-4 rounded-full text-[#6A0610] text-sm md:text-base hover:scale-105 transition-all duration-300 overflow-hidden'
        >
          <img 
            src={assets.appointment_img} 
            alt="appointment" 
            className='absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 object-contain opacity-30'
          />
          Book appointment
        </button> */}

        {/* Method 3: Button group with separate image */}
        {/* <div className='flex items-center gap-4'>
          <button 
            onClick={() => { navigate('/lawyers'); scrollTo(0, 0) }} 
            className='bg-white px-8 py-3 rounded-full text-[#6A0610] text-sm md:text-base hover:scale-105 transition-all duration-300'
          >
            Book appointment
          </button>
          <img 
            src={assets.appointment_img} 
            alt="appointment" 
            className='w-12 h-12 object-contain'
          />
        </div> */}
      </div>

      {/* -----------------Right Side ----------------*/}
      <div className='hidden md:block md:w-1/2 lg:w-[370px] relative'>
        <img
          className='w-full absolute bottom-0 h-auto max-w-md'
          src={assets.header_img}
          alt="lawyer consultation"
        />
      </div>
    </div>
  )
}

export default Banner