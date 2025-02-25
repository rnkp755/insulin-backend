import { Router } from "express";
import {
	addAddress,
	getAddresses,
	getAddress,
	updateAddress,
	deleteAddress,
} from "../controllers/address.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const addressRouter = Router();

addressRouter.route("/add").post(verifyJWT, addAddress);
addressRouter.route("/").get(verifyJWT, getAddresses);
addressRouter.route("/:id").get(verifyJWT, getAddress);
addressRouter.route("/update/:id").patch(verifyJWT, updateAddress);
addressRouter.route("/delete/:id").delete(verifyJWT, deleteAddress);

export default addressRouter;
