import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AdminContext } from '../context/AdminContext';
import { LawyerContext } from '../context/LawyerContext';

// Icons from react-icons
import { MdDashboard, MdAssignmentInd, MdMap, MdPersonAdd, MdPeople, MdEventNote, MdPerson ,MdMail } from 'react-icons/md';

const Sidebar = () => {
    const { aToken } = useContext(AdminContext);
    const { dToken } = useContext(LawyerContext);

    const navItemClass = ({ isActive }) =>
        `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer 
     ${isActive ? 'bg-[#FCEAEA] border-r-4 border-[#6A0610]' : ''}`;

    const iconStyle = { color: '#6A0610' };

    return (
        <div className="min-h-screen bg-white border-r text-[#515151] mt-5">
            {aToken && (
                <ul>
                    {/* HOME Section */}
                    <li className="px-3 md:px-9 py-2 mt-2">
                        <p className="text-xs font-semibold text-[#6A0610] uppercase tracking-wider">Home</p>
                    </li>
                    <NavLink className={navItemClass} to="/admin-dashboard">
                        <MdDashboard size={24} style={iconStyle} />
                        <p>Dashboard</p>
                    </NavLink>
                    <NavLink className={navItemClass} to="/all-appointments">
                        <MdEventNote size={24} style={iconStyle} />
                        <p>Appointments</p>
                    </NavLink>

                    {/* LAWYER SECTION */}
                    <li className="px-3 md:px-9 py-2 mt-4">
                        <p className="text-xs font-semibold text-[#6A0610] uppercase tracking-wider">Lawyer Section</p>
                    </li>
                    <NavLink className={navItemClass} to="/add-lawyer">
                        <MdPersonAdd size={24} style={iconStyle} />
                        <p>Add Lawyer</p>
                    </NavLink>
                    <NavLink className={navItemClass} to="/application-requests">
                        <MdAssignmentInd size={24} style={iconStyle} />
                        <p>Register Requests</p>
                    </NavLink>
                    <NavLink className={navItemClass} to="/lawyer-list">
                        <MdPeople size={24} style={iconStyle} />
                        <p>Lawyers List</p>
                    </NavLink>

                    {/* GIS DASHBOARDS Section */}
                    <li className="px-3 md:px-9 py-2 mt-4">
                        <p className="text-xs font-semibold text-[#6A0610] uppercase tracking-wider">GIS Dashboards</p>
                    </li>
                    <NavLink className={navItemClass} to="/gis-dashboard">
                        <MdMap size={24} style={iconStyle} />
                        <p>Lawyers GIS Dashboard</p>
                    </NavLink>
                    <NavLink className={navItemClass} to="/gis-client-dashboard">
                        <MdMap size={24} style={iconStyle} />
                        <p>Client GIS Dashboard</p>
                    </NavLink>

                     {/*Messages Section */}
                    <li className="px-3 md:px-9 py-2 mt-4">
                        <p className="text-xs font-semibold text-[#6A0610] uppercase tracking-wider">Message Section</p>
                    </li>
                    <NavLink className={navItemClass} to="/mail">
                        <MdMail size={24} style={iconStyle} />
                        <p>E-Mail</p>
                    </NavLink>

                </ul>
            )}

            {dToken && (
                <ul>
                    <NavLink className={navItemClass} to="/lawyer-dashboard">
                        <MdDashboard size={24} style={iconStyle} />
                        <p className="hidden md:block">Dashboard</p>
                    </NavLink>

                    <NavLink className={navItemClass} to="/lawyer-appointments">
                        <MdEventNote size={24} style={iconStyle} />
                        <p className="hidden md:block">Appointments</p>
                    </NavLink>

                    <NavLink className={navItemClass} to="/lawyer-profile">
                        <MdPerson size={24} style={iconStyle} />
                        <p className="hidden md:block">Profile</p>
                    </NavLink>

                     <NavLink className={navItemClass} to="/mail-to-admin">
                        <MdPerson size={24} style={iconStyle} />
                        <p className="hidden md:block">Mail To Admin</p>
                    </NavLink>
                </ul>
            )}
        </div>
    );
};

export default Sidebar;