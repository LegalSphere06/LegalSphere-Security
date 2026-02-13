import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import api from '../utils/api'
import { sanitizeInput } from '../utils/sanitize'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {

  const { backendUrl, token, setToken } = useContext(AppContext)
  const navigate = useNavigate()
  const [state, setState] = useState('Sign Up')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password policy checks
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }

  const allChecksPassed = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      if (state === 'Sign Up') {
        if (!allChecksPassed) {
          toast.error('Please meet all password requirements')
          return
        }
        if (password !== confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
        const { data } = await api.post('/api/user/register', { name: sanitizeInput(name), password, email: sanitizeInput(email) })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await api.post('/api/user/login', { password, email: sanitizeInput(email) })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      // Handle rate limiting and other HTTP errors
      if (error.response?.status === 429) {
        toast.error('Too many login attempts. Please try again in a few minutes.')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('An error occurred. Please try again.')
      }
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px]  bg-white sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up" : "log in"} to book appointment</p>

        {
          state === "Sign Up" && <div className='w-full'>
            <p>Full Name</p>
            <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="text" onChange={(e) => setName(e.target.value)} value={name} required />
          </div>
        }

        <div className='w-full'>
          <p>Email</p>
          <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="email" onChange={(e) => setEmail(e.target.value)} value={email} required />
        </div>

        {/* Password field with eye icon */}
        <div className='w-full'>
          <p>Password</p>
          <div className='relative'>
            <input
              className='border border-zinc-300 rounded w-full p-2 mt-1 pr-10'
              type={showPassword ? 'text' : 'password'}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
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

        {/* Password policy hints - only show during Sign Up */}
        {state === "Sign Up" && password.length > 0 && (
          <div className='w-full text-xs space-y-1'>
            <p className={passwordChecks.minLength ? 'text-green-600' : 'text-red-500'}>
              {passwordChecks.minLength ? '\u2713' : '\u2717'} At least 8 characters
            </p>
            <p className={passwordChecks.hasUppercase ? 'text-green-600' : 'text-red-500'}>
              {passwordChecks.hasUppercase ? '\u2713' : '\u2717'} At least one uppercase letter
            </p>
            <p className={passwordChecks.hasLowercase ? 'text-green-600' : 'text-red-500'}>
              {passwordChecks.hasLowercase ? '\u2713' : '\u2717'} At least one lowercase letter
            </p>
            <p className={passwordChecks.hasNumber ? 'text-green-600' : 'text-red-500'}>
              {passwordChecks.hasNumber ? '\u2713' : '\u2717'} At least one number
            </p>
            <p className={passwordChecks.hasSpecial ? 'text-green-600' : 'text-red-500'}>
              {passwordChecks.hasSpecial ? '\u2713' : '\u2717'} At least one special character
            </p>
          </div>
        )}

        {/* Confirm Password - only show during Sign Up */}
        {state === "Sign Up" && (
          <div className='w-full'>
            <p>Confirm Password</p>
            <div className='relative'>
              <input
                className={`border rounded w-full p-2 mt-1 pr-10 ${confirmPassword.length > 0
                    ? passwordsMatch ? 'border-green-500' : 'border-red-500'
                    : 'border-zinc-300'
                  }`}
                type={showConfirmPassword ? 'text' : 'password'}
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-zinc-400 hover:text-zinc-600'
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className='text-red-500 text-xs mt-1'>Passwords do not match</p>
            )}
          </div>
        )}

        <button type='submit'
          style={{ background: 'linear-gradient(to right, #D00C1F, #6A0610)' }}
          className='text-white w-full py-2 rounded-md text-base'>{state === 'Sign Up' ? "Create Account" : "Login"} </button>
        {
          state === "Sign Up"
            ? <p>Already have an account?<span onClick={() => setState('Login')} className='text-[#6A0610] underline cursor-pointer'> Login here</span></p>
            : <p>Create a new account? <span onClick={() => setState('Sign Up')} className='text-[#6A0610] underline cursor-pointer'>Click here</span></p>
        }
      </div>
    </form>
  )
}

export default Login
