import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldCheck, ShieldOff } from 'lucide-react';

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleToggleMFA = async () => {
    setMfaLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/toggle-mfa`,
        {},
        { headers: { token } }
      );
      if (data.success) {
        setUserData((prev) => ({ ...prev, mfaEnabled: data.mfaEnabled }));
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('phone', userData.phone);
      formData.append('address', JSON.stringify(userData.address));
      formData.append('gender', userData.gender);
      formData.append('dob', userData.dob);
      
      if (image) {
        formData.append('image', image);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`, 
        formData, 
        {
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        await loadUserProfileData();
        setIsEdit(false);
        setImage(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return userData && (
    <div className="max-w-3xl mx-auto bg-white-400 p-6 rounded-lg shadow-lg space-y-6 text-sm">

      <div className="flex items-center justify-center">
        {isEdit ? (
          <label htmlFor="image" className="relative cursor-pointer group">
            <img
              className="w-36 h-36 object-cover rounded-full opacity-80 group-hover:opacity-100 transition"
              src={image ? URL.createObjectURL(image) : userData.image}
              alt="Profile"
            />
            {!image && (
              <img
                src={assets.upload_icon}
                className="w-8 absolute bottom-2 right-2"
                alt="Upload"
              />
            )}
            <input 
              type="file" 
              id="image" 
              hidden 
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])} 
            />
          </label>
        ) : (
          <img className="w-36 h-36 object-cover rounded-full" src={userData.image} alt="Profile" />
        )}
      </div>

      <div className="text-center">
        {isEdit ? (
          <input
            type="text"
            className="text-2xl font-semibold text-center border-b border-gray-300 focus:outline-none focus:border-primary"
            value={userData.name}
            onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
          />
        ) : (
          <p className="text-2xl font-semibold text-gray-800">{userData.name}</p>
        )}
      </div>

      <hr className="border-gray-300" />

      <div>
        <h3 className="text-gray-500 font-semibold mb-2 underline">CONTACT INFORMATION</h3>
        <div className="grid grid-cols-[120px_1fr] gap-y-3 text-gray-700">
          <p className="font-medium">Email:</p>
          <p className="text-blue-500 break-all">{userData.email}</p>

          <p className="font-medium">Phone:</p>
          {isEdit ? (
            <input
              className="bg-gray-50 border rounded px-2 py-1 focus:outline-none"
              value={userData.phone}
              onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
              type="text"
            />
          ) : (
            <p className="text-blue-400">{userData.phone}</p>
          )}

          <p className="font-medium">Address:</p>
          {isEdit ? (
            <div className="space-y-2">
              <input
                className="w-full bg-gray-50 border rounded px-2 py-1 focus:outline-none"
                value={userData.address.line1}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))
                }
                type="text"
                placeholder="Address Line 1"
              />
              <input
                className="w-full bg-gray-50 border rounded px-2 py-1 focus:outline-none"
                value={userData.address.line2}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))
                }
                type="text"
                placeholder="Address Line 2"
              />
            </div>
          ) : (
            <div className="text-gray-500">
              <p>{userData.address.line1}</p>
              <p>{userData.address.line2}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-gray-500 font-semibold mb-2 underline">BASIC INFORMATION</h3>
        <div className="grid grid-cols-[120px_1fr] gap-y-3 text-gray-700">
          <p className="font-medium">Gender:</p>
          {isEdit ? (
            <select
              className="bg-gray-50 border rounded px-2 py-1 focus:outline-none"
              value={userData.gender}
              onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <p className="text-gray-400">{userData.gender}</p>
          )}

          <p className="font-medium">Birthday:</p>
          {isEdit ? (
            <input
              className="bg-gray-50 border rounded px-2 py-1 focus:outline-none"
              value={userData.dob}
              onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
              type="date"
            />
          ) : (
            <p className="text-gray-400">{userData.dob}</p>
          )}
        </div>
      </div>

      {/* Security Settings - MFA Toggle */}
      <div>
        <h3 className="text-gray-500 font-semibold mb-2 underline">SECURITY SETTINGS</h3>
        <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-4">
          <div className="flex items-center gap-3">
            {userData.mfaEnabled !== false ? (
              <ShieldCheck size={24} className="text-green-600" />
            ) : (
              <ShieldOff size={24} className="text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-700">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-gray-500">
                {userData.mfaEnabled !== false
                  ? "A verification code will be sent to your email each time you login."
                  : "Enable 2FA to add an extra layer of security to your account."}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMFA}
            disabled={mfaLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50 ${
              userData.mfaEnabled !== false
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
            }`}
          >
            {mfaLoading
              ? "Updating..."
              : userData.mfaEnabled !== false
                ? "Disable 2FA"
                : "Enable 2FA"}
          </button>
        </div>
      </div>

      <div className="text-center pt-6">
        {isEdit ? (
          <button
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition"
            onClick={updateUserProfileData}
          >
            Save Information
          </button>
        ) : (
          <button
            className="border border-primary text-primary px-6 py-2 rounded-full hover:bg-primary hover:text-white transition"
            onClick={() => setIsEdit(true)}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;