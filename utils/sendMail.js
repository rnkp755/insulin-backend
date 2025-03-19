import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendMail = async(email, subject, text) => {
    try {
        await transporter.sendMail({
    		from: process.env.EMAIL_USER,
    		to: email,
            subject,
            text
    	});
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

const sendOTPMail = async (email, otp) => {
    const subject = "Your OTP Code";
    const text = `Your Verification OTP is ${otp}. It will expire in 5 minutes.`;
    await sendMail(email, subject, text);
};

const orderCancelMail = async (email, order) => {
    // TODO: Email Text could be improved
    const subject = `Order ${order._id} Cancelled`;
    const text = `Your order ${order._id} has been cancelled.`;
    await sendMail(email, subject, text);
};

const paymentCaptureMail = async (email, order) => {
    // TODO: Email Text could be improved
    const subject = `Payment Success`;
    const text = `Your payment for order ${order._id} has succeeded. Please check the status in the website.`;
    await sendMail(email, subject, text);
}

const paymentFailureMail = async (email, order) => {
    // TODO: Email Text could be improved
    const subject = `Payment Failed`;
    const text = `Your payment for order ${order._id} has failed. Please check the status in the website.`;
    await sendMail(email, subject, text);
}

const refundCreationMail = async (email, amount) => {
    const subject = `Refund Initiated`;
    const text = `A refund of ${amount} has been initiated. You'll receive the amount in your account within 5-7 business days.`;
    await sendMail(email, subject, text);
};

const refundProcessedMail = async (email, amount) => {
    const subject = `Refund Processed`;
    const text = `A refund of ${amount} has been processed.`;
    await sendMail(email, subject, text);
}

const refundFailureMail = async (email, amount) => {
    const subject = `Refund Failed`;
    const text = `A refund of ${amount} has failed. Please contact support for more details.`;
    await sendMail(email, subject, text);
}

export {
    sendOTPMail,
    orderCancelMail,
    paymentCaptureMail,
    paymentFailureMail,
    refundCreationMail,
    refundProcessedMail,
    refundFailureMail,
};