import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='md:mx-10'>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                {/*---------Left section-------*/}
                <div>
                    <img className='mb-5 w-20' src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 leading-6'><b>Meet My Lawyer</b> connects you with trusted legal experts—anytime, anywhere. Book consultations, upload documents securely, and manage payments with ease. Legal support, simplified..</p>
                </div>

                {/*---------Center section-------*/}
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>Home</li>
                        <li>About Us</li>
                        <li>Contact us</li>
                        <li>Privacy policy</li>
                    </ul>
                </div>

                {/*---------Right section-------*/}
                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>077 471 6901</li>
                        <li>yohanmri.21@uom.lk</li>
                    </ul>
                </div>
            </div>

            {/*--------Copyright Text------------*/}
            <div>
                <hr></hr>
                <p className='py-5 text-sm text-center'>Copyright ©Yohan Maha Ranasingha</p>
            </div>
        </div>
    )
}

export default Footer
