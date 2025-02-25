import { Router } from "express";
import {
	createOrder,
	getMyOrders,
	getOrder,
	cancelOrder,
	getAllOrders,
	updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const orderRouter = Router();

orderRouter.route("/create").post(verifyJWT, createOrder);
orderRouter.route("/my-orders").get(verifyJWT, getMyOrders);
orderRouter.route("/:id").get(verifyJWT, getOrder);
orderRouter.route("/cancel/:id").patch(verifyJWT, cancelOrder);
orderRouter.route("/").get(verifyAdmin, getAllOrders);
orderRouter.route("/update-status/:id").patch(verifyAdmin, updateOrderStatus);

export default orderRouter;
