import { Router } from "express";
import {
	addToCart,
	getCart,
	updateCart,
	removeFromCart,
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const cartRouter = Router();

cartRouter.route("/add").post(verifyJWT, addToCart);
cartRouter.route("/").get(verifyJWT, getCart);
cartRouter.route("/update").patch(verifyJWT, updateCart);
cartRouter.route("/remove/:itemId").patch(verifyJWT, removeFromCart);

export default cartRouter;
