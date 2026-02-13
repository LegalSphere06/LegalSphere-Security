import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import api from '../utils/api';
import { sanitizeInput } from '../utils/sanitize';
import { toast } from 'react-toastify';

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData();
      formData.append('name', sanitizeInput(userData.name));
      formData.append('phone', sanitizeInput(userData.phone));
      formData.append('address', JSON.stringify({
        line1: sanitizeInput(userData.address.line1 || ''),
        line2: sanitizeInput(userData.address.line2 || '')
      }));
      formData.append('gender', userData.gender);
      formData.append('dob', userData.dob);

      if (image) {
        formData.append('image', image);
      }

      const { data } = await api.post(
        '/api/user/update-profile',
        formData,
        {
          headers: {
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
