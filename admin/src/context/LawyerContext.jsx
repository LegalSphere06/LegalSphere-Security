import React, { useState } from 'react'
import { createContext } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const LawyerContext = createContext()

const LawyerContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const [appointments, setAppointments] = useState([])

    const [dashData, setDashData] = useState(false)

    const [profileData, setProfileData] = useState(null)

    const getAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/lawyer/appointments', { headers: { dToken } })
            if (data.success) {
                setAppointments(data.appointments)
                console.log(data.appointments)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const completeAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/lawyer/complete-appointment', { appointmentId }, { headers: { dToken } })
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/lawyer/cancel-appointment', { appointmentId }, { headers: { dToken } })
            if (data.success) {
                toast.success(data.message)
                getAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }


const updateOnlineLink = async (onlineLink) => {
    try {
        const { data } = await axios.post(
            backendUrl + '/api/lawyer/update-online-link',
            { online_link: onlineLink },
            { headers: { dToken } }
        );

        if (data.success) {
            toast.success(data.message);
            // Update profile data locally
            setProfileData(prev => ({ ...prev, online_link: onlineLink }));
            return true;
        } else {
            toast.error(data.message);
            return false;
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update link");
        console.error("Update link error:", error);
        return false;
    }
};

    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/lawyer/dashboard', { headers: { dToken } })
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    const getProfileData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/lawyer/profile', { headers: { dToken } })

            if (data.success) {
                setProfileData(data.profileData)
                console.log(data.profileData);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }
    
    const sendEmailToAdmin = async (subject, message) => {
  try {
    const { data } = await axios.post(
      backendUrl + '/api/lawyer/send-email-to-admin',
      { subject, message },
      { headers: { dToken } }
    );

    if (data.success) {
      toast.success(data.message);
      return true;
    } else {
      toast.error(data.message);
      return false;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to send email");
    console.error("Send email error:", error);
    return false;
  }
};
    const value = {
        dToken, setDToken,
        backendUrl,
        appointments, setAppointments,
        getAppointments,
        completeAppointment, cancelAppointment,
        dashData, setDashData, getDashData,
        profileData, setProfileData,
        getProfileData,  sendEmailToAdmin ,updateOnlineLink
    }
    
    return (
        <LawyerContext.Provider value={value}>
            {props.children}
        </LawyerContext.Provider>
    )
}



export default LawyerContextProvider