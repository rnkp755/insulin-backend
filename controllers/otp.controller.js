import asyncHandler from "../utils/asyncHandler.js";
import { OTP } from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// Generate and send OTP
const sendOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;
	const { reason } = req.params;
	if (!email) throw new APIError(400, "Email is required");
	if (!reason) throw new APIError(400, "Invalid Route. Reason is required");

	if (reason == "reset-password") {
		const user = await User.findOne({ email });
		if (!user) {
			throw new APIError(400, "User doesn't exist");
		}
	}

	const otp = crypto.randomInt(1000, 9999).toString();

	await OTP.create({
		email,
		otp,
		reason,
		expiresAt: new Date(Date.now() + 5 * 60 * 1000),
	});

	await transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Your OTP Code",
		text: `Your Verification OTP is ${otp}. It will expire in 5 minutes.`,
	});

	return res
		.status(200)
		.json(new APIResponse(200, {}, "OTP sent successfully"));
});

// Verify OTP and register user
const verifyOTP = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	const { reason } = req.params;

	if (!email || !otp) throw new APIError(400, "Email & OTP is required");
	if (!reason) throw new APIError(400, "Invalid Route. Reason is required");

	const record = await OTP.findOne({ email }).sort({ createdAt: -1 });
	if (
		!record ||
		record.otp !== otp ||
		record.expiresAt < new Date() ||
		record.reason !== reason
	) {
		throw new APIError(400, "Invalid or expired OTP");
	}

	let user;
	if (reason === "register") {
		let user = await User.findOne({ email });
		if (user) {
			throw new APIError(400, "User already exists");
		}
		user = await User.create({ email });
		await OTP.deleteMany({ email, reason });
	} else if (reason === "reset-password") {
		await allowPasswordChange(email, reason);
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ user },
				reason == "register"
					? "OTP verified, proceed with registration"
					: "OTP verified, Please change password within 5 minutes"
			)
		);
});

const allowPasswordChange = async (email, reason) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new APIError(400, "User doesn't exist");
	}

	user.allowPasswordReset = true;
	await user.save({ validateBeforeSave: false });
	await OTP.deleteMany({ email, reason });
	return user;
};

export { sendOTP, verifyOTP };
