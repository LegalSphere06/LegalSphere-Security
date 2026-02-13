import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { LawyerContext } from '../context/LawyerContext'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {

    const [state, setState] = useState('Admin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const { setAToken, backendUrl } = useContext(AdminContext)
    const { setDToken } = useContext(LawyerContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            if (state === 'Admin') {
                const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
                if (data.success) {
                    localStorage.setItem('aToken', data.token)
                    setAToken(data.token)
                } else {
                    toast.error(data.message)
                }
            }
            else {
                const { data } = await axios.post(backendUrl + '/api/lawyer/login', { email, password })
                if (data.success) {
                    localStorage.setItem('dToken', data.token)
                    setDToken(data.token)
                } else {
                    toast.error(data.message)
                }
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
            <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
                <p className='text-2xl font-semibold m-auto'><span className='text-[#D00C1F]'>{state}</span> Login</p>
                <div className='w-full'>
                    <p>Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
                </div>
                <div className='w-full'>
                    <p>Password</p>
                    <div className='relative'>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10'
                            type={showPassword ? 'text' : 'password'}
                            required
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-zinc-400 hover:text-zinc-600'
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <button className='text-white w-full py-2 rounded-md text-base'
                    style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
                >Login</button>
                {
                    state === 'Admin'
                        ? <p>Lawyer Login ? <span className='text-[#6A0610] underline cursor-pointer' onClick={() => setState('Lawyer')}> Click here</span></p>
                        : <p>Admin Login ? <span className='text-[#6A0610] underline cursor-pointer' onClick={() => setState('Admin')}> Click here</span></p>
                }
            </div>
        </form>
    )
}

export default Login
