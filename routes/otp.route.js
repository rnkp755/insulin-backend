import { Router } from "express";
import { sendOTP, verifyOTP } from "../controllers/otp.controller.js";

const otpRouter = Router();

otpRouter.route("/send/:reason").post(sendOTP);
otpRouter.route("/verify/:reason").post(verifyOTP);

export default otpRouter;
