import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/home'
import Lawyers from './pages/Lawyers'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RegisterLawyer from './pages/RegisterLawyer'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const App = () => {
  return (
    <div className='mx-4 sm:mx-[8%]'>
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/lawyers' element={<Lawyers />} />
        <Route path='/lawyers/:speciality' element={<Lawyers />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/register-lawyer' element={<RegisterLawyer />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:lawyerId' element={<Appointment />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App