import express, { Router } from "express";
import { verifySignature } from "../webhooks/razorpay.webhook.js";

const webhookRouter = Router();

webhookRouter.post(
  "/razorpay",
  express.raw({ type: 'application/json' }),
  verifySignature
);
export default webhookRouter;