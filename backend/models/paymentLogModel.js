//******************************************************************************************************************************************************** */
import mongoose from "mongoose";

// Payment Transaction Log Schema
// Policy: Maintain audit trail of all payment activities for fraud detection and compliance
const paymentLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    appointmentId: { type: String, required: true },
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
        type: String, 
        enum: ['initiated', 'signature_verified', 'signature_failed', 'completed', 'failed', 'flagged_fraud'],
        required: true 
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    failureReason: { type: String },
    flagReason: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Index for efficient querying of fraud patterns
paymentLogSchema.index({ userId: 1, timestamp: -1 });
paymentLogSchema.index({ ipAddress: 1, timestamp: -1 });
paymentLogSchema.index({ status: 1 });

const paymentLogModel = mongoose.models.paymentLog || mongoose.model('paymentLog', paymentLogSchema);

export default paymentLogModel;
//************************************************************************************************************************** */