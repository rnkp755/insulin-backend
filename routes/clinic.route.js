import { Router } from "express";
import multer from "multer";
import {
	addClinic,
	getClinic,
	getAllClinics,
	updateClinic,
	deleteClinic
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
clinicRouter.route("/delete/:id").delete(verifyAdmin, deleteClinic);

export default clinicRouter;
