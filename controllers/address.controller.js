import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";

const addAddress = asyncHandler(async (req, res) => {
	const { name, mobile, pincode, address, city, state, landmark } =
		req.body;
	if (
		[name, mobile, pincode, address, city, state].includes(undefined) ||
		[name, mobile, pincode, address, city, state].some(
			(field) => field.trim() === ""
		)
	) {
		throw new APIError(400, "Please provide all the required fields");
	}

	const user = await User.findById(req.user?._id);
	if (!user) {
		throw new APIError(404, "User not found");
	}

	const newAddress = new Address({
		userId: req.user?._id,
		name,
		mobile,
		pincode,
		address,
		city,
		state,
		landmark,
	});

	await newAddress.save({ validateBeforeSave: true });

	return res.status(201).json(
		new APIResponse(
			201,
			{
				address: newAddress,
			},
			"Address added successfully"
		)
	);
});

const getAddresses = asyncHandler(async (req, res) => {
	const addresses = await Address.find({ userId: req.user?._id });
	if (!addresses) {
		throw new APIError(404, "Unauthorized access");
	}
	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				addresses,
				"Addresses fetched successfully"
			)
		);
});

const getAddress = asyncHandler(async (req, res) => {
	const userId = req.user?._id.toString();
	const address = await Address.findById(req.params.id);
	if (!address || address.userId.toString() !== userId) {
		throw new APIError(404, "Unauthorized acces");
	}
	return res
		.status(200)
		.json(
			new APIResponse(200, address, "Address fetched successfully")
		);
});

const updateAddress = asyncHandler(async (req, res) => {
	const userId = req.user?._id.toString();
	const address = await Address.findById(req.params.id);
	if (!address || address.userId.toString() !== userId) {
		throw new APIError(404, "Unauthorized access");
	}
	const {
		name,
		mobile,
		pincode,
		address: addr,
		city,
		state,
		landmark,
	} = req.body;
	if (name !== undefined && name.trim() !== "") {
		address.name = name;
	}
	if (mobile !== undefined && mobile.trim() !== "") {
		address.mobile = mobile;
	}
	if (pincode !== undefined && pincode.trim() !== "") {
		address.pincode = pincode;
	}
	if (addr !== undefined && addr.trim() !== "") {
		address.address = addr;
	}
	if (city !== undefined && city.trim() !== "") {
		address.city = city;
	}
	if (state !== undefined && state.trim() !== "") {
		address.state = state;
	}
	if (landmark !== undefined) {
		address.landmark = landmark;
	}
	await address.save({ validateBeforeSave: true });
	return res
		.status(200)
		.json(
			new APIResponse(200, address, "Address updated successfully")
		);
});

const deleteAddress = asyncHandler(async (req, res) => {
	const userId = req.user?._id.toString();
	const address = await Address.findById(req.params.id);
	if (!address || address.userId.toString() !== userId) {
		throw new APIError(404, "Unauthorized access");
	}
	await Address.findByIdAndDelete(address._id);
	return res
		.status(200)
		.json(new APIResponse(200, {}, "Address deleted successfully"));
});

export { addAddress, getAddresses, getAddress, updateAddress, deleteAddress };
