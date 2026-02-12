import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddLawyer from './pages/Admin/AddLawyer';
import LawyersList from './pages/Admin/LawyersList';
import GISdashboard from './pages/Admin/GISdashboard';
import { LawyerContext } from './context/LawyerContext';
import LawyerDashboard from './pages/Lawyer/LawyerDashboard';
import LawyerAppointment from './pages/Lawyer/LawyerAppointment';
import LawyerProfile from './pages/Lawyer/LawyerProfile';
import Applications_lawyers from './pages/Admin/Applications_lawyers';
import GISClientDashboard from './pages/Admin/GISClientDashboard';
import MailDashboard from './pages/Admin/MailDashboard';
import MailDashboardtoAdmin from './pages/Lawyer/MailDashboardtoAdmin';


const App = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(LawyerContext)

  return aToken || dToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          {/*  Admin Route  */}
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/gis-dashboard' element={<GISdashboard />} />
          <Route path='/gis-client-dashboard' element={<GISClientDashboard/>} />
          <Route path='/all-appointments' element={<AllApointments />} />
          <Route path='/application-requests' element={<Applications_lawyers />} />
          <Route path='/add-lawyer' element={<AddLawyer />} />
          <Route path='/lawyer-list' element={<LawyersList />} />
          <Route path='/mail' element={<MailDashboard/>} />

          {/*  Lawyer Route  */}
          <Route path='/lawyer-dashboard' element={<LawyerDashboard />} />
          <Route path='/lawyer-appointments' element={<LawyerAppointment />} />
          <Route path='/lawyer-profile' element={<LawyerProfile />} />
          <Route path='/mail-to-admin' element={<MailDashboardtoAdmin/>}/>
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App
