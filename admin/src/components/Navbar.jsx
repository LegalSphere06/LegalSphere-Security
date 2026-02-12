import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { LawyerContext } from '../context/LawyerContext'

const Navbar = () => {

    const { aToken, setAToken } = useContext(AdminContext)
    const { dToken, setDToken } = useContext(LawyerContext)

    const navigate = useNavigate()

    const logout = () => {
        navigate('/')
        aToken && setAToken('')
        aToken && localStorage.removeItem('aToken')
        dToken && setDToken('')
        dToken && localStorage.removeItem('dToken')
    }


    return (
        <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
            <div className='flex items-center gap-2 text-xs'>
                <img className='w-[50px] sm:w-[50px] cursor-pointer' src={assets.admin_logo} alt='' />
                <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Lawyer'} </p>
            </div>
            <button onClick={logout} className=' text-white text-sm px-10 py-2 rounded-full'
                style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
            >Logout</button>
        </div>
    )
}

export default Navbar
