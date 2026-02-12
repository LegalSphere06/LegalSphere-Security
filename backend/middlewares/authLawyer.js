import jwt from "jsonwebtoken";

// Lawyer authentication middleware
const authLawyer = async (req, res, next) => {
    try {
        const { dtoken } = req.headers;
        if (!dtoken) {
            return res.json({
                success: false,
                message: "Not Authorized Login Again",
            });
        }
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET); //decode the token

        // Fix: Initialize req.body if it doesn't exist before setting userId
        req.body = req.body || {};
        req.body.lawyerId = token_decode.id;

        next();
    } catch (error) {
        console.log("Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export default authLawyer;
