import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";
import { paymentCaptureMail, paymentFailureMail, refundCreationMail, refundProcessedMail } from "../utils/sendMail.js";

const verifySignature = asyncHandler(async (req, res) => {
    const body = req.body;
    const signature = req.headers["x-razorpay-signature"];

    if (!Buffer.isBuffer(body)) {
      throw new APIError(400, "Invalid body type");
    }

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
                status: "Confirmed"
            },
            { new: true }
        );
        const user = await User.findById(order.userId);
        paymentCaptureMail(user.email, order);
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
        paymentFailureMail(user.email, order);
    } else if (event.event === "refund.created") {
        const payment = event.payload.payment.entity;
        order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                paymentStatus: "Refunded_Created",
                razorpayRefundId: payment.id,
                status: "Cancelled"
            },
            { new: true }
        ); 
        const user = await User.findById(order.userId);
        refundCreationMail(user.email, order.totalAmount);
    } else if (event.event === "refund.failed") {
        const payment = event.payload.payment.entity;
        order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                paymentStatus: "Refund_Failed",
            },
            { new: true }
        ); 
        const user = await User.findById(order.userId);
        refundFailureMail(user.email, order.totalAmount);
    } else if (event.event === "refund.processed") {
        const payment = event.payload.payment.entity;
        order = await Order.findOneAndUpdate(
            { razorpayPaymentId: payment.id },
            {
                paymentStatus: "Refund_Processed",
            },
            { new: true }
        ); 
        const user = await User.findById(order.userId);
        refundProcessedMail(user.email, order.totalAmount);
    }
    else {
        throw new APIError(400, "Invalid event type");
    }

    if (!order) {
        throw new APIError(404, "Order not found");
    }

    return res
		.status(201)
		.json(new APIResponse(201, order, "Payment status updated successfully"));
});

export { verifySignature };