import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500 '>
        <p>ABOUT <span className='text-gray-700 font-medium'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Welcome to Meet My Lawyer, your trusted partner in managing your legal needs with ease and efficiency. At Meet My Lawyer, we understand the challenges individuals face when it comes to finding the right legal counsel and managing legal matters.</p>
          <p>Meet My Lawyer is committed to excellence in legal technology. We continuously strive to enhance our platform, integrating the latest advancements to improve user experience and deliver superior service. Whether you're booking your first consultation or managing ongoing legal issues, Meet My Lawyer is here to support you every step of the way.</p>
          <b className='text-gray-800'>Our Vision</b>
          <p>Our vision at Meet My Lawyer is to create a seamless legal experience for every user. We aim to bridge the gap between clients and lawyers, making it easier for you to access the legal assistance you need, when you need it.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
      </div>


      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px]  hover:bg-gradient-to-r hover:from-[#6A0610] hover:to-[#D00C1F] transition duration-300 p-4 hover:text-white text-gray cursor-poiner'>

          <b>EFFICIENCY:</b>
          <p>Streamlined Appointment Scheduling That fits into your Busy Lifestyle</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px]  hover:bg-gradient-to-r hover:from-[#6A0610] hover:to-[#D00C1F] transition duration-300 p-4 hover:text-white text-gray cursor-poiner'>
          <b>CONVENIENCE:</b>
          <p>Access To A Network Of Trusted Healthe care Professionals in Your Area.</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px]  hover:bg-gradient-to-r hover:from-[#6A0610] hover:to-[#D00C1F] transition duration-300 p-4 hover:text-white text-gray cursor-poiner'>
          <b>PERSONALIZATION:</b>
          <p>Tailored Recommendations And Reminders ToHelp You Stay On Top Of Your Health</p>
        </div>
      </div>
    </div>
  )
}

export default About