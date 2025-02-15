import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Medicine } from "../models/medicine.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const addMedicine = asyncHandler(async (req, res, next) => {
	const { name, description, price, quantityInStock, stripSize } = req.body;
	if (
		[name, description, price, quantityInStock].includes(undefined) ||
		[name, description, price, quantityInStock].some(
			(field) => field.trim() === ""
		) ||
		price < 0 ||
		quantityInStock < 0
	) {
		throw new APIError(400, "Please provide all the required fields");
	}

	if (!req.files || req.files.length === 0) {
		return res.status(400).json({ message: "No images uploaded" });
	}

	const user = await User.findById(req.user?._id);
	if (!user || user?.role !== "admin") {
		throw new APIError(404, "Unauthorized Access");
	}

	const imageUploadPromises = req.files.map(async (file) => {
		const response = await uploadOnCloudinary(file.path);
		if (!response) {
			throw new APIError(500, "Failed to upload images");
		}
		return response.url;
	});
	const images = await Promise.all(imageUploadPromises);

	const medicine = new Medicine({
		name,
		description,
		price,
		quantityInStock,
		stripSize: stripSize || 0,
		images,
	});

	await medicine.save({ validateBeforeSave: true });

	const existedMedicine = await Medicine.findById(medicine._id).select(
		"-__v -createdAt -updatedAt"
	);
	if (!existedMedicine) {
		throw new APIError(500, "Failed to save medicine");
	}

	return res
		.status(201)
		.json(
			new APIResponse(
				201,
				existedMedicine,
				"User Registered Successfully"
			)
		);
});

export { addMedicine };
