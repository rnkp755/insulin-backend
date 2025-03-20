import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Medicine } from "../models/medicine.model.js";
import { Test } from "../models/test.model.js";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";

const addToCart = asyncHandler(async (req, res) => {
	const { itemId, itemType, quantity, date, timeSlot } = req.body;
	if (!itemId || !itemType) {
		throw new APIError(400, "Please provide all the required fields");
	}

	// Validation for medicine
	if (itemType === "Medicine" && (!quantity || quantity < 1)) {
		throw new APIError(
			400,
			"Please provide valid quantity for medicine"
		);
	}

	// Validation for test
	if (itemType === "Test" && (!date || !timeSlot)) {
		throw new APIError(
			400,
			"Please provide date and time slot for test"
		);
	}

	const user = await User.findById(req.user?._id);
	if (!user) {
		throw new APIError(404, "Unauthorized Access");
	}

	let amount = 0;
	if (itemType === "Medicine") {
		const medicine = await Medicine.findById(itemId);
		if (!medicine) {
			throw new APIError(404, "Medicine not found");
		}
		amount = medicine.price * quantity;
	} else if (itemType === "Test") {
		const test = await Test.findById(itemId);
		if (!test) {
			throw new APIError(404, "Test not found");
		}
		amount = test.price;
	}

	const cart = await Cart.findOne({ userId: req.user?._id });
	if (!cart) {
		let newCart = null;
		if (itemType === "Medicine") {
			newCart = new Cart({
				userId: req.user?._id,
				item: [
					{
						itemId,
						itemType,
						quantity,
					},
				],
				totalAmount: amount,
			});
		} else if (itemType === "Test") {
			newCart = new Cart({
				userId: req.user?._id,
				item: [
					{
						itemId,
						itemType,
						date,
						timeSlot,
					},
				],
				totalAmount: amount,
			});
		}
		await newCart.save({ validateBeforeSave: true });
	} else {
		const itemIndex = cart.item.findIndex(
			(item) => item.itemId.toString() === itemId
		);
		if (itemIndex === -1) {
			cart.item.push({
				itemId,
				itemType,
				quantity,
				date,
				timeSlot,
			});
		} else {
			cart.item[itemIndex].quantity += quantity;
		}
		cart.totalAmount += amount;
		await cart.save({ validateBeforeSave: true });
	}

	const updatedCart = await Cart.findOne({ userId: req.user?._id });
	if (!updatedCart) {
		throw new APIError(500, "Failed to add item to cart");
	}

	return res
		.status(201)
		.json(
			new APIResponse(
				200,
				updatedCart,
				"Item Added to cart successfully"
			)
		);
});

const getCart = asyncHandler(async (req, res) => {
	const cart = await Cart.findOne({ userId: req.user?._id });
	if (!cart) {
		throw new APIError(404, "Cart not found");
	}

	return res
		.status(200)
		.json(new APIResponse(200, cart, "Cart fetched successfully"));
});

const updateCart = asyncHandler(async (req, res) => {
	const { itemId, itemType, quantity, date, timeSlot } = req.body;
	if (!itemId || !itemType) {
		throw new APIError(400, "Please provide all the required fields");
	}

	// Validation for medicine
	if (itemType === "Medicine" && (!quantity || quantity < 1)) {
		throw new APIError(
			400,
			"Please provide valid quantity for medicine"
		);
	}

	// Validation for test
	if (itemType === "Test" && !date && !timeSlot) {
		throw new APIError(
			400,
			"Please provide date or time slot for test"
		);
	}

	const user = await User.findById(req.user?._id);
	if (!user) {
		throw new APIError(404, "Unauthorized Access");
	}

	let amount = 0;
	let medicine = null,
		test = null;
	if (itemType === "Medicine") {
		medicine = await Medicine.findById(itemId);
		if (!medicine) {
			throw new APIError(404, "Medicine not found");
		}
		amount = medicine.price * quantity;
	} else if (itemType === "Test") {
		test = await Test.findById(itemId);
		if (!test) {
			throw new APIError(404, "Test not found");
		}
	}

	const cart = await Cart.findOne({ userId: req.user?._id });
	if (!cart) {
		throw new APIError(404, "Cart not found");
	}

	const itemIndex = cart.item.findIndex(
		(item) => item.itemId.toString() === itemId
	);
	if (itemIndex === -1) {
		throw new APIError(404, "Item not found in cart");
	}

	const item = cart.item[itemIndex];
	let oldAmount =
		item.itemType === "Medicine"
			? medicine.price * item.quantity
			: test.price;
	cart.totalAmount += amount - oldAmount;

	if (itemType === "Medicine") {
		cart.item[itemIndex].quantity = quantity;
	} else if (itemType === "Test") {
		if (date) cart.item[itemIndex].date = date;
		if (timeSlot) cart.item[itemIndex].timeSlot = timeSlot;
	}

	await cart.save({ validateBeforeSave: true });

	const updatedCart = await Cart.findOne({ userId: req.user?._id });
	if (!updatedCart) {
		throw new APIError(500, "Failed to update cart");
	}

	return res
		.status(200)
		.json(
			new APIResponse(200, updatedCart, "Cart updated successfully")
		);
});

const removeFromCart = asyncHandler(async (req, res) => {
	const { itemId } = req.params;
	if (!itemId) {
		throw new APIError(400, "Please provide item id");
	}

	const cart = await Cart.findOne({ userId: req.user?._id });
	if (!cart) {
		throw new APIError(404, "Cart not found");
	}

	const itemIndex = cart.item.findIndex(
		(item) => item.itemId.toString() === itemId
	);
	if (itemIndex === -1) {
		throw new APIError(404, "Item not found in cart");
	}

	const item = cart.item[itemIndex];
	let amount = 0;
	if (item.itemType === "Medicine") {
		const medicine = await Medicine.findById(item.itemId);
		if (!medicine) {
			throw new APIError(404, "Medicine not found");
		}
		amount = medicine.price * item.quantity;
	} else if (item.itemType === "Test") {
		const test = await Test.findById(item.itemId);
		if (!test) {
			throw new APIError(404, "Test not found");
		}
		amount = test.price;
	}

	cart.totalAmount -= amount;
	cart.item.splice(itemIndex, 1);
	await cart.save({ validateBeforeSave: true });

	const updatedCart = await Cart.findOne({ userId: req.user?._id });
	if (!updatedCart) {
		throw new APIError(500, "Failed to remove item from cart");
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				updatedCart,
				"Item removed from cart successfully"
			)
		);
});

const clearCart = asyncHandler(async (req, res) => {
	const cart = await Cart.findOneAndDelete({ userId: req.user?._id });
	if (!cart) {
		throw new APIError(404, "Cart not found");
	}

	return res
		.status(200)
		.json(new APIResponse(200, {}, "Cart cleared successfully"));
});

export { addToCart, getCart, updateCart, removeFromCart, clearCart };
