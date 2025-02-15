import { Router } from "express";
import multer from "multer";
import {
	addTest,
	getTest,
	getAllTests,
	updateTest,
} from "../controllers/test.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const testRouter = Router();

const upload = multer({ storage: multer.diskStorage({}) });
testRouter.route("/add").post(verifyAdmin, upload.array("images", 5), addTest);

testRouter.route("/:id").get(getTest);
testRouter.route("/").get(getAllTests);
testRouter.route("/update/:id").patch(verifyAdmin, updateTest);

export default testRouter;
