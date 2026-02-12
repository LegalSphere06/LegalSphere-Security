import React, { useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'  // Added AppContext import

const Navbar = () => {

    const navigate = useNavigate();
    const { token, setToken, userData } = useContext(AppContext)

    const [showMenu, setShowMenu] = useState(false)
    const logout = () => {
        setToken(false)
        localStorage.removeItem('token')
    }

    return (
        <div className='relative bg-[#D8D8E3]'>
            <div className='flex items-center justify-between text-sm py-0 mb-1'>
                <div className='flex items-center gap-3'>
                    <img onClick={() => navigate('/')} className='pt-2 w-[90px] cursor-pointer bg-[#D8D8E3] relative z-10' src={assets.logo} alt="" />
                    <span className='text-[#6A0610] font-semibold text-lg'>MEET MY LAWYER</span>
                </div>
                <ul className='hidden md:flex items-start gap-5 font-medium'>
                    <NavLink to='/'>
                        <li className='py-1 text-[#6A0610]'>HOME</li>
                        <hr className='border-none outline-none h-0.5 bg-[#F50E0E] w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to='/lawyers'>
                        <li className='py-1 text-[#6A0610]'>ALL LAWYERS</li>
                        <hr className='border-none outline-none h-0.5 bg-[#F50E0E] w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to='/about'>
                        <li className='py-1 text-[#6A0610]'>ABOUT</li>
                        <hr className='border-none outline-none h-0.5 bg-[#F50E0E] w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to='/contact'>
                        <li className='py-1 text-[#6A0610]'>CONTACT</li>
                        <hr className='border-none outline-none h-0.5 bg-[#F50E0E] w-3/5 m-auto hidden' />
                    </NavLink>
                </ul>
                <div className='flex items-center gap-4'>
                    {
                        //If we are not logged in we will display this button
                        token && userData
                            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
                                <img className='w-8 h-8 rounded-full object-cover' src={userData.image} alt="" />
                                <img className='w-2.5' src={assets.dropdown_icon} alt="" />
                                <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                                    <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                                        <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                                        <p onClick={() => navigate('my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                                        <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                                    </div>
                                </div>
                            </div>
                            : <button
                                onClick={() => navigate('/login')}
                                className='text-white px-8 py-3 rounded-full font-light hidden md:block hover:scale-105 transition-all'
                                style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
                            >
                                Create account
                            </button>
                    }

                    <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />


                    {/*-----------Mobile Menu------------------*/}

                    <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
                        <div className='flex items-center justify-between px-5 py-6'>
                            <img className='w-20' src={assets.logo} alt="" />
                            <span className='text-[#6A0610] font-semibold text-lg'>MEET MY LAWYER</span>

                            <img className='w-7' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt="" />
                        </div>
                        <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                            <NavLink
                                onClick={() => setShowMenu(false)}
                                to='/'
                                className={({ isActive }) => isActive ? 'px-4 py-2 rounded-full inline-block text-white' : 'px-4 py-2 rounded-full inline-block'}
                                style={({ isActive }) => isActive ? { background: 'linear-gradient(to right, #D00C1F, #6A0610)' } : {}}
                            >
                                <p>HOME</p>
                            </NavLink>
                            <NavLink
                                onClick={() => setShowMenu(false)}
                                to='/lawyers'
                                className={({ isActive }) => isActive ? 'px-4 py-2 rounded-full inline-block text-white' : 'px-4 py-2 rounded-full inline-block'}
                                style={({ isActive }) => isActive ? { background: 'linear-gradient(to right, #D00C1F, #6A0610)' } : {}}
                            >
                                <p>ALL LAWYERS</p>
                            </NavLink>
                            <NavLink
                                onClick={() => setShowMenu(false)}
                                to='/about'
                                className={({ isActive }) => isActive ? 'px-4 py-2 rounded-full inline-block text-white' : 'px-4 py-2 rounded-full inline-block'}
                                style={({ isActive }) => isActive ? { background: 'linear-gradient(to right, #D00C1F, #6A0610)' } : {}}
                            >
                                <p>ABOUT</p>
                            </NavLink>
                            <NavLink
                                onClick={() => setShowMenu(false)}
                                to='/contact'
                                className={({ isActive }) => isActive ? 'px-4 py-2 rounded-full inline-block text-white' : 'px-4 py-2 rounded-full inline-block'}
                                style={({ isActive }) => isActive ? { background: 'linear-gradient(to right, #D00C1F, #6A0610)' } : {}}
                            >
                                <p>CONTACT</p>
                            </NavLink>
                        </ul>
                    </div>
                </div>
            </div>
            {/* Overlay line that starts after the logo */}
            <div className='absolute bottom-4 left-20 right-0 border-b border-b-gray-400 z-0'></div>
        </div>
    )
}

export default Navbar