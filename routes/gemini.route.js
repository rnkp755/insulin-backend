import { Router } from "express";
import { askToGemini } from "../controllers/gemini.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const geminiRouter = Router();

geminiRouter.route("/ask").post( askToGemini);

export default geminiRouter;
