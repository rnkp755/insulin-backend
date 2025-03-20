import { Router } from "express";
import {
	addAddress,
	getAddresses,
	getAddress,
	updateAddress,
	deleteAddress,
	getAddressForAdmin
} from "../controllers/address.controller.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const addressRouter = Router();

addressRouter.route("/add").post(verifyJWT, addAddress);
addressRouter.route("/").get(verifyJWT, getAddresses);
addressRouter.route("/:id").get(verifyJWT, getAddress);
addressRouter.route("/update/:id").patch(verifyJWT, updateAddress);
addressRouter.route("/delete/:id").post(verifyJWT, deleteAddress);

addressRouter.route("/getAddressForAdmin/:id").post(verifyAdmin, getAddressForAdmin);

export default addressRouter;
