import express from "express";
import { sendOTP, verifyOTP } from "../controllers/otp.controller.js";

const otpRouter = express.Router();

otpRouter.route("/send/:reason").post(sendOTP);
otpRouter.route("/verify/:reason").post(verifyOTP);

export default otpRouter;
