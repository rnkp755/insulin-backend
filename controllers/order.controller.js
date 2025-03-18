import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import { Medicine } from "../models/medicine.model.js";
import { Order } from "../models/order.model.js";
import { Test } from "../models/test.model.js";
import Razorpay from "razorpay";

const createOrder = asyncHandler(async (req, res) => {
	const { addressId, items, paymentMode } = req.body;
	if (!addressId || !items || !paymentMode) {
		throw new APIError(400, "Please provide all the required fields");
	}
	const userId = req.user?._id;
	const user = await User.findById(userId);
	const address = await Address.findById(addressId);
	if (
		!user ||
		!address ||
		address.userId.toString() !== userId.toString()
	) {
		throw new APIError(404, "Unauthorized access");
	}
	let itemsToAdd = [];
	let totalAmount = 0;
	for (let item of items) {
		const { itemId, itemType, quantity, date, timeSlot } = item;
		if (!itemId || !itemType) {
			throw new APIError(
				400,
				"Please provide all the required fields"
			);
		}
		const actualItem =
			itemType === "Medicine"
				? await Medicine.findById(itemId)
				: await Test.findById(itemId);
		if (!actualItem) {
			throw new APIError(404, "Item not found");
		}
		if (itemType === "Medicine" && quantity > actualItem.quantityInStock) {
			throw new APIError(
				400,
				"Quantity exceeds the available stock"
			);
		}
		if (itemType === "Test" && (!date || !timeSlot)) {
			throw new APIError(
				400,
				"Please provide all the required fields"
			);
		}
		totalAmount +=
			itemType === "Medicine"
				? actualItem.price * quantity
				: actualItem.price;
		itemsToAdd.push({
			itemId,
			itemType,
			quantity,
			date,
			timeSlot,
		});
	}
	let order = new Order({
		userId,
		addressId,
		items: itemsToAdd,
		totalAmount,
		paymentMode,
	});

	// Handle Razorpay payment here
	if (paymentMode === "ONLINE") {
		const razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});

		const razorpayOrder = await razorpay.orders.create({
			amount: totalAmount * 100,
			currency: "INR",
			receipt: `${userId.toString()}-${new Date().getTime()}`,
			notes: {
				userId: userId.toString(),
			}
		});

		order.razorpayOrderId = razorpayOrder.id;
	}

	console.log(order);

	await order.save({ validateBeforeSave: true });

	return res
		.status(201)
		.json(new APIResponse(201, order, "Order placed successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const orders = await Order.find({ userId });
	if (!orders) {
		throw new APIError(404, "No orders found");
	}
	return res
		.status(200)
		.json(new APIResponse(200, orders, "Orders fetched successfully"));
});

const getOrder = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const order = await Order.findById(req.params.id);
	if (!order) {
		throw new APIError(404, "Order not found");
	}
	const user = await User.findById(userId);
	if (
		order.userId.toString() !== userId.toString() &&
		user.role != "admin"
	) {
		throw new APIError(404, "Unauthorized access");
	}
	return res
		.status(200)
		.json(new APIResponse(200, order, "Order fetched successfully"));
});

const cancelOrder = asyncHandler(async (req, res) => {
	const userId = req.user?._id.toString();
	const order = await Order.findById(req.params.id);
	if (!order || order.userId.toString() !== userId) {
		throw new APIError(404, "Unauthorized access");
	}
	if (order.status === "Cancelled") {
		throw new APIError(400, "Order already cancelled");
	}
	order.status = "Cancelled";
	await order.save({ validateBeforeSave: true });
	return res
		.status(200)
		.json(new APIResponse(200, {}, "Order cancelled successfully"));
});

const getAllOrders = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
	if (isNaN(page) || isNaN(limit)) {
		throw new APIError(400, "Invalid page or limit parameters");
	}
	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: { [sortBy || "createdAt"]: sortType || "desc" },
		select: "-__v -updatedAt",
	};
	const queryOptions = {};
	if (query) {
		queryOptions["$or"] = [
			{ name: { $regex: query, $options: "i" } },
			{ description: { $regex: query, $options: "i" } },
		];
	}
	const [orders, totalOrders] = await Promise.all([
		Order.find(queryOptions, null, options),
		Order.countDocuments(queryOptions),
	]);

	if (!orders || orders.length === 0) {
		throw new APIError(404, "No Orders Found");
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ orders, totalOrders },
				"Orders fetched successfully"
			)
		);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
	const { status, type } = req.body;
	if (!status || !type) {
		throw new APIError(400, "Please provide the status & type");
	}

	let updateField = {};

	if (type === "paymentStatus") {
		updateField.paymentStatus = status;
	} else if (type === "orderStatus") {
		updateField.status = status;
	} else {
		throw new APIError(400, "Invalid type provided. Please use 'paymentStatus' or 'orderStatus'");
	}

	const order = await Order.findByIdAndUpdate(
		{ _id: req.params.id },
		updateField,
		{ new: true }
	);
	if (!order) {
		throw new APIError(404, "Order not found");
	}
	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				order,
				"Order status updated successfully"
			)
		);
});

export {
	createOrder,
	getMyOrders,
	getOrder,
	cancelOrder,
	getAllOrders,
	updateOrderStatus,
};
