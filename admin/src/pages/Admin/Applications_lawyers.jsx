import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { MdCheckCircle, MdCancel, MdVisibility, MdClose } from 'react-icons/md';
import { FaFileAlt, FaImage, FaFilePdf, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const Applications_lawyers = () => {
    const { aToken, applications, getAllApplications, backendUrl } = useContext(AdminContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState('');
    const [actionApplication, setActionApplication] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewDocument, setPreviewDocument] = useState(null);

    const itemsPerPage = 8;

    useEffect(() => {
        if (aToken) {
            getAllApplications();
        }
    }, [aToken]);

    const filteredApplications = (applications || []).filter((app) =>
        (app.application_name && app.application_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.application_email && app.application_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.application_speciality && app.application_speciality.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (app.application_district && app.application_district.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleView = (app) => {
        setSelectedApplication(app);
        setShowViewModal(true);
        setPreviewDocument(null);
    };

    const handleAction = (app, action) => {
        setActionApplication(app);
        setActionType(action);
        setShowConfirmModal(true);
    };

    const previewDoc = (url, type, name) => {
        if (url) {
            setPreviewDocument({ url, type, name });
        } else {
            toast.error(`${name} not available`);
        }
    };

    const processAction = async () => {
        try {
            setIsProcessing(true);
            const endpoint = actionType === 'approve' ? '/api/admin/approve-application' : '/api/admin/reject-application';
            const { data } = await axios.post(backendUrl + endpoint, { applicationId: actionApplication._id }, { headers: { aToken } });

            if (data.success) {
                toast.success(data.message);
                getAllApplications();
                setShowConfirmModal(false);
                setActionApplication(null);
                setActionType('');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error(error.response?.data?.message || 'Failed to process application');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className='w-full max-w-7xl m-5'>
            <div className='flex justify-between items-center mb-4'>
                <p className='text-lg font-medium'>Lawyer Applications</p>
                <div className='flex-1 max-w-md mx-4'>
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Search by name, email, speciality, or district...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                        <svg className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <div className='text-sm text-gray-600'>Total: {filteredApplications.length} applications</div>
            </div>

            {searchQuery && (
                <div className='mb-4 text-sm text-gray-600'>
                    Found {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </div>
            )}

            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.3fr_2.5fr_2fr_1.8fr_1.5fr_1.5fr_1fr_1.5fr] py-3 px-6 border-b font-medium text-gray-700 bg-gray-50'>
                    <p>#</p>
                    <p>Name</p>
                    <p>Email</p>
                    <p>Speciality</p>
                    <p>Experience</p>
                    <p>District</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>

                {currentItems.length === 0 ? (
                    <div className='text-center py-12 text-gray-500'>
                        {applications === undefined ? (
                            <div>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p>Loading applications...</p>
                            </div>
                        ) : searchQuery ? (
                            <div>
                                <p className='text-lg mb-2'>No applications match your search</p>
                                <p className='text-sm'>Try adjusting your search terms</p>
                            </div>
                        ) : (
                            <div>
                                <p className='text-lg mb-2'>No applications found</p>
                                <p className='text-sm'>Applications will appear here once lawyers submit registration forms</p>
                            </div>
                        )}
                    </div>
                ) : (
                    currentItems.map((app, index) => (
                        <div key={app._id || index} className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.3fr_2.5fr_2fr_1.8fr_1.5fr_1.5fr_1fr_1.5fr] items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50'>
                            <p className='max-sm:hidden'>{startIndex + index + 1}</p>
                            <div className='flex items-center gap-2'><p className='font-medium truncate'>{app.application_name}</p></div>
                            <p className='max-sm:hidden truncate'>{app.application_email}</p>
                            <p className='truncate'>{app.application_speciality}</p>
                            <p>{app.application_experience}</p>
                            <p>{app.application_district}</p>
                            <div className='flex items-center gap-1'>
                                <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                                <span className='text-yellow-600 text-xs font-medium'>Pending</span>
                            </div>
                            <div className='flex items-center gap-1'>
                                <button onClick={() => handleView(app)} className='p-1.5 hover:bg-blue-100 rounded text-blue-600' title='View Details'><MdVisibility size={16} /></button>
                                <button onClick={() => handleAction(app, 'approve')} className='p-1.5 hover:bg-green-100 rounded text-green-600' title='Approve'><MdCheckCircle size={16} /></button>
                                <button onClick={() => handleAction(app, 'reject')} className='p-1.5 hover:bg-red-100 rounded text-red-600' title='Reject'><MdCancel size={16} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-4">
                    <button onClick={() => goToPage(currentPage - 1)} className={`px-3 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`} disabled={currentPage === 1}>Previous</button>
                    <div className="flex gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            return (<button key={pageNum} onClick={() => goToPage(pageNum)} className={`px-3 py-1 rounded text-sm ${pageNum === currentPage ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>{pageNum}</button>);
                        })}
                    </div>
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => goToPage(currentPage + 1)} className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`} disabled={currentPage === totalPages}>Next</button>
                </div>
            )}

            {showViewModal && selectedApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Application Details - {selectedApplication.application_name}</h2>
                            <button onClick={() => { setShowViewModal(false); setPreviewDocument(null); }} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-1/2 overflow-y-auto p-6 border-r">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-3">Personal Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Name:</strong> {selectedApplication.application_name}</div>
                                            <div><strong>Email:</strong> {selectedApplication.application_email}</div>
                                            <div><strong>Phone:</strong> {selectedApplication.application_phone}</div>
                                            <div><strong>Gender:</strong> {selectedApplication.application_gender}</div>
                                            <div><strong>Date of Birth:</strong> {selectedApplication.application_dob || 'Not provided'}</div>
                                            <div><strong>About:</strong> {selectedApplication.application_about || 'Not provided'}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-3">Professional Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>Speciality:</strong> {selectedApplication.application_speciality}</div>
                                            <div><strong>Experience:</strong> {selectedApplication.application_experience}</div>
                                            <div><strong>License Number:</strong> {selectedApplication.application_license_number}</div>
                                            <div><strong>Bar Association:</strong> {selectedApplication.application_bar_association}</div>
                                            <div><strong>Degree:</strong> {selectedApplication.application_degree?.join(', ')}</div>
                                            <div><strong>Languages:</strong> {selectedApplication.application_languages_spoken?.join(', ')}</div>
                                            <div><strong>Consultation Fees:</strong> LKR {selectedApplication.application_fees}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-3">Location & Courts</h3>
                                        <div className="space-y-2 text-sm">
                                            <div><strong>District:</strong> {selectedApplication.application_district}</div>
                                            <div><strong>Address:</strong> {typeof selectedApplication.application_address === 'object' ? selectedApplication.application_address?.street : selectedApplication.application_address || 'Not provided'}</div>
                                            <div><strong>Primary Court:</strong> {selectedApplication.application_court1}</div>
                                            <div><strong>Secondary Court:</strong> {selectedApplication.application_court2 || 'Not provided'}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-3">Documents</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                                                <div className="flex items-center gap-2"><FaImage className="text-blue-500" /><span className="text-sm font-medium">Profile Image</span></div>
                                                {selectedApplication.application_image ? (
                                                    <button onClick={() => previewDoc(selectedApplication.application_image, 'image', 'Profile Image')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"><FaEye /> Preview</button>
                                                ) : (<span className="text-sm text-gray-500">Not uploaded</span>)}
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                                                <div className="flex items-center gap-2"><FaFilePdf className="text-red-500" /><span className="text-sm font-medium">License Certificate</span></div>
                                                {selectedApplication.application_license_certificate?.originalUrl ? (
                                                    <button onClick={() => previewDoc(selectedApplication.application_license_certificate.originalUrl, 'pdf', 'License Certificate')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"><FaEye /> Preview PDF</button>
                                                ) : (<span className="text-sm text-gray-500">Not uploaded</span>)}
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                                                <div className="flex items-center gap-2"><FaFilePdf className="text-red-500" /><span className="text-sm font-medium">Birth Certificate</span></div>
                                                {selectedApplication.application_birth_certificate?.originalUrl ? (
                                                    <button onClick={() => previewDoc(selectedApplication.application_birth_certificate.originalUrl, 'pdf', 'Birth Certificate')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"><FaEye /> Preview PDF</button>
                                                ) : (<span className="text-sm text-gray-500">Not uploaded</span>)}
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2 mb-2"><FaFileAlt className="text-green-500" /><span className="text-sm font-medium">Professional Certificates</span></div>
                                                {selectedApplication.application_legal_professionals_certificate?.length > 0 ? (
                                                    <div className="space-y-2 ml-6">
                                                        {selectedApplication.application_legal_professionals_certificate.map((cert, index) => (
                                                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded hover:bg-gray-50">
                                                                <span className="text-sm text-gray-600">Certificate {index + 1}</span>
                                                                <button onClick={() => previewDoc(cert.originalUrl || cert, 'pdf', `Professional Certificate ${index + 1}`)} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"><FaEye /> Preview</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (<span className="text-sm text-gray-500 ml-6">Not uploaded</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-1/2 bg-gray-100 flex flex-col">
                                {previewDocument ? (
                                    <>
                                        <div className="p-4 bg-white border-b flex justify-between items-center">
                                            <h3 className="font-semibold text-gray-800">{previewDocument.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <a href={previewDocument.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Open in New Tab</a>
                                                <button onClick={() => setPreviewDocument(null)} className="p-1 hover:bg-gray-100 rounded" title="Close preview"><MdClose size={20} /></button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-auto p-4">
                                            {previewDocument.type === 'image' ? (
                                                <img src={previewDocument.url} alt={previewDocument.name} className="max-w-full h-auto mx-auto rounded shadow-lg" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col">
                                                    <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDocument.url)}&embedded=true`} className="w-full flex-1 rounded shadow-lg border-0" title={previewDocument.name} style={{ minHeight: '600px' }} />
                                                    <div className="mt-3 flex gap-2 justify-center">
                                                        <a href={previewDocument.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Open in New Tab</a>
                                                        <a href={previewDocument.url} download className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">Download PDF</a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <FaEye size={48} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-lg">Select a document to preview</p>
                                            <p className="text-sm mt-1">Click on any &quot;Preview&quot; button to view documents here</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3 bg-white">
                            <button onClick={() => { setShowViewModal(false); setPreviewDocument(null); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Close</button>
                            <button onClick={() => { setShowViewModal(false); setPreviewDocument(null); handleAction(selectedApplication, 'approve'); }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve Application</button>
                            <button onClick={() => { setShowViewModal(false); setPreviewDocument(null); handleAction(selectedApplication, 'reject'); }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reject Application</button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && actionApplication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">{actionType === 'approve' ? 'Approve Application' : 'Reject Application'}</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to <strong>{actionType}</strong> the application from <strong>{actionApplication.application_name}</strong>?
                            {actionType === 'approve' && (<span className="block mt-2 text-sm">This will add them as an active lawyer in the system.</span>)}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowConfirmModal(false)} disabled={isProcessing} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button onClick={processAction} disabled={isProcessing} className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 ${actionType === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}>{isProcessing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Applications_lawyers;