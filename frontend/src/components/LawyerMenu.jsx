import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';

const LawyerMenu = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div
                className="flex rounded-lg md:mx-10 relative overflow-hidden"
                style={{
                    background:
                        'linear-gradient(to right, #6A0610 5%, #6A0610 35%, #000000 50%, #D00C1F 65%, #D00C1F 100%)',
                }}
            >
                {/* -----------------Left Side: Text + Image ----------------*/}
                <div className="flex-1 md:w-1/2 relative flex flex-col justify-between border-r border-black/30">
                    {/* Text Section */}
                    <div className="text-section">
                        <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-4 pl-10 ml-10 pt-6">
                            Register as a Lawyer
                        </h2>
                    </div>

                    {/* Image + Button Section - positioned relative to fingertip */}
                    <div className="image-button-section relative flex justify-start items-end h-full -ml-12">
                        <img
                            className="w-5/4 max-w-xl object-contain object-bottom -ml-8"
                            src={assets.appointment1_img}
                            alt="Legal consultation"
                            style={{ marginBottom: '0' }}
                        />
                        {/* Button positioned much more to the left */}
                        <button
                            onClick={() => {
                                navigate('/register-lawyer');
                                scrollTo(0, 0);
                            }}
                            className="absolute bg-white text-sm sm:text-base text-[#6A0610] px-6 py-3 rounded-full font-medium z-10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 flex items-center gap-2 hover:scale-125"
                            style={{
                                top: '30%', // Positioned above the finger
                                right: '13%', // Moved significantly more to the left
                                transform: 'translate(0, -50%)',
                            }}
                        >
                            <UserPlus size={18} />
                            Register As a Lawyer
                        </button>
                    </div>
                </div>

                {/* -----------------Center Content (Black Blend Area) ----------------*/}
                <div className="absolute left-1/2 top-0 w-32 h-full bg-gradient-to-b from-black/50 via-black to-black/50 transform -translate-x-1/2 z-20 flex flex-col justify-center items-center px-4">
                    <h3 className="text-white text-lg md:text-xl lg:text-2xl font-bold mb-3 text-center">
                        For Lawyers Only
                    </h3>
                    <p className="text-white/90 text-xs md:text-sm text-center leading-relaxed">
                        Exclusive access for legal professionals. Join our platform to connect with clients and manage your practice efficiently.
                    </p>
                </div>

                {/* -----------------Right Side: Text + Image + Buttons ----------------*/}
                <div className="flex-1 md:w-1/2 relative flex flex-col justify-between border-l border-black/30">
                    {/* Text Section */}
                    <div className="text-section">
                        <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-4 pr-20 pt-6 text-right">
                            Login As A Lawyer
                        </h2>
                    </div>

                    {/* Image + Button Section - positioned relative to fingertip */}
                    <div className="image-button-section relative flex justify-end items-end ">
                        <img
                            className="w-3/4 max-w-xs object-contain object-bottom"
                            src={assets.appointment_img}
                            alt="Legal registration"
                        />
                       
<button
    onClick={() => {
        window.open('http://localhost:5174/', '_blank');
        scrollTo(0, 0);
    }}
    className="absolute bg-white text-sm sm:text-base text-[#6A0610] px-6 py-3 rounded-full font-medium z-10 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 flex items-center gap-2 hover:scale-125"
    style={{
        top: '15%',
        left: '25%',
        transform: 'translate(0, -50%)',
    }}
>
    <LogIn size={18} />
    Login As a Lawyer
</button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerMenu;