import React from 'react'
import { assets } from '../assets/assets'

const Header = () => {
    return (
        <div className='flex flex-col md:flex-row flex-wrap rounded-lg px-6 md:px-10 lg:px-20 relative overflow-hidden mt-10 mb-5'
            style={{ background: 'linear-gradient(to right,black, #6A0610, #D00C1F, black)' }}

        >

            {/*-----------Left Side ----------- */}
            <div className='md:w-1/3 relative flex items-end justify-center'>
                {/* Reddish gradient overlay */}
                <div className='absolute inset-0  rounded-lg'></div>
                <img
                    className='w-full md:w-auto md:h-[80vh] max-h-[500px] object-contain rounded-lg relative z-10'
                    src={assets.header_img2}
                    alt=""
                    loading="lazy"
                />
            </div>

            {/*-----------Middle Content ----------- */}
            <div className='md:w-1/3 flex flex-col items-center justify-center gap-4 py-10 text-center relative'>
                {/* Subtle white/transparent gradient */}
                <div className='absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/5 rounded-lg'></div>
                <div className='relative z-10'>
                    <p className='text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight'>
                        Book Appointment <br /> with Trusted Lawyers
                    </p>
                    <div className='flex flex-col items-center gap-3 text-white text-sm font-light mt-4'>
                        <img className='w-28' src={assets.group_profiles} alt="" />
                        <p>Simply browse through out extensive list of trusted lawyers, <br className='hidden sm:block' />shedule your appointment hassle-free</p>
                    </div>
                    {/* <a href="#speciality" className='inline-flex items-center justify-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm hover:scale-105 transition-all duration-300 mt-4 w-48'>
                        BOOK NOW<img className='w-3' src={assets.arrow_icon} alt="" />
                    </a> */}
                    <a href="http://localhost:5174/login"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='inline-flex items-center justify-center gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm hover:scale-105 transition-all duration-300 mt-4 w-48'>
                        Lawyer Login<img className='w-3' src={assets.arrow_icon} alt="" />
                    </a>


                </div>
            </div>

            {/*-----------Right Side ----------- */}
            <div className='md:w-1/3 relative flex items-end justify-center'>
                {/* Blackish gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-gray-900/40 via-gray-800/25 to-transparent rounded-lg'></div>
                <img
                    className='w-full md:w-auto md:h-[80vh] max-h-[500px] object-contain rounded-lg relative z-10'
                    src={assets.header_img}
                    alt=""
                    loading="lazy"
                />
            </div>
        </div>
    )
}

export default Header