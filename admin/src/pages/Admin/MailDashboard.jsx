import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';

const MailDashboard = () => {
  const { lawyers, getAllLawyers, sendEmailToLawyers, aToken } = useContext(AdminContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawyers, setSelectedLawyers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (aToken) {
      getAllLawyers();
    }
  }, [aToken]);

  // Filter lawyers based on search
  const filteredLawyers = lawyers.filter(lawyer =>
    lawyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual lawyer selection
  const handleLawyerSelect = (lawyerId) => {
    setSelectedLawyers(prev => {
      if (prev.includes(lawyerId)) {
        return prev.filter(id => id !== lawyerId);
      } else {
        return [...prev, lawyerId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLawyers([]);
    } else {
      setSelectedLawyers(filteredLawyers.map(lawyer => lawyer._id));
    }
    setSelectAll(!selectAll);
  };

  // Get selected lawyer emails
  const getSelectedEmails = () => {
    return lawyers
      .filter(lawyer => selectedLawyers.includes(lawyer._id))
      .map(lawyer => lawyer.email);
  };

  // Handle send email
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (selectedLawyers.length === 0) {
      toast.error('Please select at least one lawyer');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter email message');
      return;
    }

    const recipientEmails = getSelectedEmails();
    const success = await sendEmailToLawyers(recipientEmails, subject, message);

    if (success) {
      setSubject('');
      setMessage('');
      setSelectedLawyers([]);
      setSelectAll(false);
    }
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll w-full">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Email Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-screen">
        {/* LEFT SIDE - Lawyer Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Select Recipients</h2>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search lawyers by name, email, or speciality..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select All */}
          <div className="mb-4 flex items-center gap-2 pb-3 border-b">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({filteredLawyers.length} lawyers)
            </span>
          </div>

          {/* Selected Count */}
          <div className="mb-4 text-sm text-indigo-600 font-medium">
            {selectedLawyers.length} lawyer{selectedLawyers.length !== 1 ? 's' : ''} selected
          </div>

          {/* Lawyers List */}
          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
            {filteredLawyers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No lawyers found</p>
            ) : (
              filteredLawyers.map((lawyer) => (
                <div
                  key={lawyer._id}
                  className={`flex items-center gap-3 p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    selectedLawyers.includes(lawyer._id) ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => handleLawyerSelect(lawyer._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedLawyers.includes(lawyer._id)}
                    onChange={() => handleLawyerSelect(lawyer._id)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <img
                    src={lawyer.image}
                    alt={lawyer.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{lawyer.name}</p>
                    <p className="text-xs text-gray-500">{lawyer.email}</p>
                    <p className="text-xs text-gray-400">{lawyer.speciality}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Email Compose */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 ">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Compose Email</h2>

          <form onSubmit={handleSendEmail}>
            {/* To Field (Display) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 min-h-[60px] max-h-[120px] overflow-y-auto">
                {selectedLawyers.length === 0 ? (
                  <p className="text-gray-400 text-sm">Select lawyers from the left panel</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getSelectedEmails().map((email, index) => (
                      <span
                        key={index}
                        className="inline-block bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
              <input
                type="text"
                placeholder="Enter email subject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
              <textarea
                placeholder="Type your message here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows="12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={selectedLawyers.length === 0}
            >
              Send Email to {selectedLawyers.length} Lawyer{selectedLawyers.length !== 1 ? 's' : ''}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MailDashboard;