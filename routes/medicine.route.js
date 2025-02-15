import { Router } from "express";
import multer from "multer";
import {
	addMedicine,
	getMedicine,
	getAllMedicines,
	updateMedicine,
} from "../controllers/medicine.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const medicineRouter = Router();

const upload = multer({ storage: multer.diskStorage({}) });
medicineRouter
	.route("/add")
	.post(verifyAdmin, upload.array("images", 5), addMedicine);

medicineRouter.route("/:id").get(getMedicine);
medicineRouter.route("/").get(getAllMedicines);
medicineRouter.route("/update/:id").patch(verifyAdmin, updateMedicine);

export default medicineRouter;
