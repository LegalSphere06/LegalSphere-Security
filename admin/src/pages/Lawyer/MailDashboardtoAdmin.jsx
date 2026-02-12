import React, { useContext, useState } from 'react';
import { LawyerContext } from '../../context/LawyerContext';
import { toast } from 'react-toastify';

const MailDashboardtoAdmin = () => {
  const { sendEmailToAdmin } = useContext(LawyerContext);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error('Please enter email subject');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter email message');
      return;
    }

    setIsSending(true);
    const success = await sendEmailToAdmin(subject, message);
    setIsSending(false);

    if (success) {
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      <h1 className='mb-3 text-lg font-medium'>Send Message to Admin</h1>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white  shadow-sm border border-gray-200 p-3">
          
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200  p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-3 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Direct Message to Admin</h3>
                <p className="text-sm text-blue-700">
                  Use this form to send important messages, queries, or reports directly to the admin team. 
                  You will receive a response at your registered email address.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendEmail}>
            {/* Subject */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter the subject of your message"
                className="w-full px-4 py-3 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={isSending}
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Type your message here... Be clear and specific about your request or inquiry."
                className="w-full px-4 py-3 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows="12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={isSending}
              />
              <p className="text-sm text-gray-500 mt-2">
                {message.length} characters
              </p>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3  font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Message to Admin
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Messages are typically reviewed within 24-48 hours. For urgent matters, please contact admin directly via phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailDashboardtoAdmin;