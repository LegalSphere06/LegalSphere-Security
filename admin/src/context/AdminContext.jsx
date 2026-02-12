import React, { useState } from 'react'
import { createContext } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';


export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
    const [lawyers, setLawyers] = useState([])
    const [reqRegister, setReqRegister] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [applications, setApplications] = useState([])

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const getAllLawyers = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/all-lawyers', {}, { headers: { aToken } })
            if (data.success) {
                setLawyers(data.lawyers)
                console.log(data.lawyers)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAllRegisterRequests = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/request-to-register', {})
            if (data.success) {
                setReqRegister(data.reqRegister)
                console.log(data.reqRegister)

            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(data.message)
        }
    }

    const changeAvailability = async (lawyerId) => {
        console.log('🔄 changeAvailability called with lawyerId:', lawyerId);
        console.log('🔑 Using token:', aToken);
        console.log('🌐 Backend URL:', backendUrl);

        try {
            console.log('📤 Making API request...');

            const { data } = await axios.post(
                backendUrl + '/api/admin/change-availability',
                { lawyerId },
                { headers: { aToken } }
            );

            console.log('📥 Full API Response:', data);
            console.log('✅ data.success:', data.success);
            console.log('💬 data.message:', data.message);
            console.log('📊 typeof data.success:', typeof data.success);

            if (data.success) {
                console.log('🎉 SUCCESS! About to show toast with message:', data.message);

                toast.success(data.message);
                console.log('📝 toast.success() called');

                toast.success('Availability changed successfully!');
                console.log('📝 backup toast.success() called');

                console.log('🔄 About to call getAllLawyers...');
                await getAllLawyers();
                console.log('✅ getAllLawyers completed');

            } else {
                console.log('❌ API returned success: false');
                console.log('❌ Error message:', data.message);
                toast.error(data.message || 'Failed to update availability');
            }

        } catch (error) {
            console.log('💥 Error occurred:', error);
            console.log('📋 Error response:', error.response?.data);
            console.log('🔍 Error message:', error.message);
            toast.error(error.response?.data?.message || error.message);
        }
    }

    const getAllAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })

            if (data.success) {
                setAppointments(data.appointments)
                console.log(data.appointments);
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(data.message)
        }
    }

    const getAllApplications = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/application/get-applications', { headers: { aToken } });

            if (data.success) {
                setApplications(data.applications);
                console.log(data.applications);
            } else {
                toast.error(data.message || "Failed to fetch applications");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Server error");
            console.error("Fetch error:", error);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(data.message)

        }
    }

    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(data.message)

        }
    }

    // ADD THIS FUNCTION HERE - INSIDE THE COMPONENT
    const sendEmailToLawyers = async (recipientEmails, subject, message) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/send-email-to-lawyers',
                { recipientEmails, subject, message },
                { headers: { aToken } }
            );

            if (data.success) {
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send emails");
            console.error("Send email error:", error);
            return false;
        }
    };

    const value = {
        aToken, setAToken,
        backendUrl, lawyers,
        getAllLawyers, changeAvailability,
        appointments, setAppointments,
        getAllAppointments,
        cancelAppointment,
        dashData, getDashData,
        getAllRegisterRequests,
        getAllApplications,
        applications, setApplications,
        sendEmailToLawyers
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider