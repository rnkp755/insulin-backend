import { Router } from "express";
import multer from "multer";
import {
	addClinic,
	getClinic,
	getAllClinics,
	updateClinic,
} from "../controllers/clinic.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const clinicRouter = Router();

const upload = multer({ storage: multer.diskStorage({}) });
clinicRouter
	.route("/add")
	.post(verifyAdmin, upload.array("images", 5), addClinic);

clinicRouter.route("/:id").get(getClinic);
clinicRouter.route("/").get(getAllClinics);
clinicRouter
	.route("/update/:id")
	.patch(verifyAdmin, upload.array("images", 5), updateClinic);

export default clinicRouter;
