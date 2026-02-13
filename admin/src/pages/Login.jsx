import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { LawyerContext } from '../context/LawyerContext'
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'

const Login = () => {

    const [state, setState] = useState('Admin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // MFA states
    const [mfaStep, setMfaStep] = useState(false)
    const [mfaToken, setMfaToken] = useState('')
    const [otp, setOtp] = useState('')

    const { setAToken, backendUrl } = useContext(AdminContext)
    const { setDToken } = useContext(LawyerContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            const endpoint = state === 'Admin' ? '/api/admin/login' : '/api/lawyer/login'
            const { data } = await axios.post(backendUrl + endpoint, { email, password })

            if (data.success) {
                if (data.requiresMFA) {
                    setMfaToken(data.mfaToken)
                    setMfaStep(true)
                    toast.success(data.message)
                } else {
                    // MFA disabled (lawyer only) - direct token
                    if (state === 'Admin') {
                        localStorage.setItem('aToken', data.token)
                        setAToken(data.token)
                    } else {
                        localStorage.setItem('dToken', data.token)
                        setDToken(data.token)
                    }
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const onVerifyOtp = async (event) => {
        event.preventDefault()

        try {
            const endpoint = state === 'Admin' ? '/api/admin/verify-mfa' : '/api/lawyer/verify-mfa'
            const { data } = await axios.post(backendUrl + endpoint, { mfaToken, otp })

            if (data.success) {
                if (state === 'Admin') {
                    localStorage.setItem('aToken', data.token)
                    setAToken(data.token)
                } else {
                    localStorage.setItem('dToken', data.token)
                    setDToken(data.token)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleBackToLogin = () => {
        setMfaStep(false)
        setMfaToken('')
        setOtp('')
    }

    const handleResendCode = async () => {
        try {
            const endpoint = state === 'Admin' ? '/api/admin/login' : '/api/lawyer/login'
            const { data } = await axios.post(backendUrl + endpoint, { email, password })
            if (data.success && data.requiresMFA) {
                setMfaToken(data.mfaToken)
                setOtp('')
                toast.success('Verification code resent.')
            } else {
                toast.error(data.message || 'Failed to resend code.')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // MFA OTP Verification Screen
    if (mfaStep) {
        return (
            <form onSubmit={onVerifyOtp} className='min-h-[80vh] flex items-center'>
                <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
                    <div className='flex items-center gap-2 m-auto'>
                        <ShieldCheck size={24} className='text-[#D00C1F]' />
                        <p className='text-2xl font-semibold'>Verify Identity</p>
                    </div>
                    <p className='text-center w-full text-gray-500 text-xs'>
                        A 6-digit verification code has been sent to your email.
                    </p>
                    <div className='w-full'>
                        <p>Verification Code</p>
                        <input
                            onChange={(e) => setOtp(e.target.value)}
                            value={otp}
                            className='border border-[#DADADA] rounded w-full p-2 mt-1 text-center tracking-widest text-lg'
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            required
                        />
                    </div>
                    <button
                        className='text-white w-full py-2 rounded-md text-base'
                        style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
                    >Verify</button>
                    <div className='flex justify-between w-full text-xs'>
                        <button type='button' onClick={handleBackToLogin} className='flex items-center gap-1 text-[#6A0610] hover:underline'>
                            <ArrowLeft size={14} /> Back to login
                        </button>
                        <button type='button' onClick={handleResendCode} className='text-[#6A0610] hover:underline'>
                            Resend code
                        </button>
                    </div>
                </div>
            </form>
        )
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
