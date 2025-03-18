import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const verifySignature = asyncHandler(async (req, res) => {
    const body = req.body;
    const signature = req.headers["X-Razorpay-Signature"];

    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");

    if(signature !== expectedSignature) {
        throw new APIError(400, "Invalid signature");
    }

    const event = JSON.parse(body.toString('utf8'));

    let order = null;

    if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        order = await Order.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                paymentStatus: "Success",
                razorpayPaymentId: payment.id,
            },
            { new: true }
        );
        const user = await User.findById(order.userId);
        sendMail(order, true, user.email);
    } else if (event.event === "payment.failed") {
        const payment = event.payload.payment.entity;
        order = await Order.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                paymentStatus: "Failed"
            },
            { new: true }
        );
        const user = await User.findById(order.userId);
        sendMail(order, false, user.email);
    } else {
        throw new APIError(400, "Invalid event type");
    }

    if (!order) {
        throw new APIError(404, "Order not found");
    }

    return res
		.status(201)
		.json(new APIResponse(201, order, "Payment status updated successfully"));
});

const sendMail = async(order, success, email) => {
    // TODO: Email Text could be improved
    await transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: email,
		subject: `Payment ${success ? "Success" : "Failed"}`,
		text: `Your payment for order ${order._id} has ${success ? "succeeded" : "failed"}. Please check the status in the website.`,
	});
};

export { verifySignature };