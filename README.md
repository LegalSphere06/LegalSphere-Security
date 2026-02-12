# Meet My Lawyer - Corporate Legal Services Platform

A comprehensive legal services platform connecting clients with lawyers, featuring appointment booking, case management, and administrative tools.

## Project Structure

```
Meet-My-Lawyer/
├── admin/          # Admin dashboard (React + Vite)
├── frontend/       # Client-facing application (React + Vite)
├── backend/        # Node.js + Express API server
└── README.md
```

## Features

- 🔐 **User Authentication**: Secure login/registration for clients, lawyers, and admins
- 👨‍⚖️ **Lawyer Profiles**: Browse and connect with qualified legal professionals
- 📅 **Appointment Booking**: Schedule consultations with lawyers
- 💼 **Case Management**: Track and manage legal cases
- 📊 **Admin Dashboard**: Comprehensive administrative controls
- 💳 **Payment Integration**: Razorpay payment gateway integration
- ☁️ **Cloud Storage**: Cloudinary integration for document management

## Tech Stack

### Frontend (Client & Admin)
- React 18
- Vite
- React Router
- Axios
- Modern UI/UX

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Cloudinary
- Razorpay

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (for payments)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yohanmri/Mini-Project---Coorporate.git
cd Meet-My-Lawyer
```

2. Install dependencies for all modules:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Admin
cd ../admin
npm install
```

3. Configure environment variables:

Create a `.env` file in the `backend` directory with the following:

```env
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CURRENCY=LKR
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend application:
```bash
cd frontend
npm run dev
```

3. Start the admin dashboard:
```bash
cd admin
npm run dev
```

The applications will be available at:
- Frontend: http://localhost:5173
- Admin: http://localhost:5174
- Backend API: http://localhost:4000

## API Endpoints

### Admin Routes
- `POST /api/admin/login` - Admin login
- `GET /api/admin/lawyers` - Get all lawyers
- `POST /api/admin/add-lawyer` - Add new lawyer

### Lawyer Routes
- `POST /api/lawyer/login` - Lawyer login
- `GET /api/lawyer/appointments` - Get lawyer appointments
- `PUT /api/lawyer/profile` - Update lawyer profile

### User Routes
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `POST /api/user/book-appointment` - Book appointment
- `GET /api/user/appointments` - Get user appointments

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Contact

For any inquiries, please contact: yohanm.ranasingha@gmail.com
