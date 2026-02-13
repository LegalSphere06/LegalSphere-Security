import mongoose from "mongoose";

const connectDB = async () => {
        try {
                mongoose.connection.on('connected', () => console.log("Database Connected"))
                mongoose.connection.on('error', (err) => console.error("Database Connection Error:", err))

                await mongoose.connect(`${process.env.MONGODB_URI.replace('/?', '/meetmylawyer?')}`, {
                        serverSelectionTimeoutMS: 5000,
                        socketTimeoutMS: 45000,
                })
        } catch (error) {
                console.error("Failed to connect to MongoDB:", error.message)
                console.error("Please check:")
                console.error("1. Your internet connection")
                console.error("2. MongoDB Atlas cluster is running")
                console.error("3. IP address is whitelisted in MongoDB Atlas")
                console.error("4. Connection string is correct")
                // Don't exit the process, let the app continue without DB
        }
}

export default connectDB