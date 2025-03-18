import { Router } from "express";
import { verifySignature } from "../webhooks/razorpay.webhook.js";

const webhookRouter = Router();

webhookRouter.route("/razorpay").post(verifySignature);

export default webhookRouter;