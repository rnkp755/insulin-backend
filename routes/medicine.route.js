import express from "express";
import multer from "multer";
import { addMedicine } from "../controllers/medicine.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const medicineRouter = express.Router();

const upload = multer({ storage: multer.diskStorage({}) });
medicineRouter
	.route("/add")
	.post(verifyAdmin, upload.array("images", 5), addMedicine);

export default medicineRouter;
