import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Medicine } from "../models/medicine.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const addMedicine = asyncHandler(async (req, res) => {
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
				"Medicine Created Successfully"
			)
		);
});

const getMedicine = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const medicine = await Medicine.findById(id).select(
		"-__v -createdAt -updatedAt"
	);
	if (!medicine) {
		throw new APIError(404, "No Medicine Found");
	}
	return res
		.status(200)
		.json(
			new APIResponse(201, medicine, "Medicine Found Successfully")
		);
});

const getAllMedicines = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
	if (isNaN(page) || isNaN(limit)) {
		throw new APIError(400, "Invalid page or limit parameters");
	}
	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: { [sortBy || "createdAt"]: sortType || "desc" },
		select: "-__v -createdAt -updatedAt",
	};
	const queryOptions = {};
	if (query) {
		queryOptions.name = { $regex: query, $options: "i" };
	}
	const [medicines, totalMedicines] = await Promise.all([
		Medicine.find(queryOptions, null, options),
		Medicine.countDocuments(queryOptions),
	]);

	if (!medicines || medicines.length === 0) {
		throw new APIError(404, "No Medicines Found");
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ medicines, totalMedicines },
				"Medicines fetched successfully"
			)
		);
});

const updateMedicine = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { name, description, price, quantityInStock, stripSize } = req.body;
	const medicine = await Medicine.findById(id);
	if (!medicine) {
		throw new APIError(404, "No Medicine Found");
	}
	if (name !== undefined && name.trim() !== "" && medicine.name !== name) {
		medicine.name = name;
	}
	if (
		description !== undefined &&
		description.trim() !== "" &&
		medicine.description !== description
	) {
		medicine.description = description;
	}
	if (price !== undefined && price > 0 && medicine.price !== price) {
		medicine.price = price;
	}
	if (
		quantityInStock !== undefined &&
		quantityInStock >= 0 &&
		medicine.quantityInStock !== quantityInStock
	) {
		medicine.quantityInStock = quantityInStock;
	}
	if (
		stripSize !== undefined &&
		stripSize >= 0 &&
		medicine.stripSize !== stripSize
	) {
		medicine.stripSize = stripSize;
	}

	await medicine.save({ validateBeforeSave: true });

	const updatedMedicine = await Medicine.findById(medicine._id).select(
		"-__v -createdAt -updatedAt"
	);

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				updatedMedicine,
				"Medicine Updated Successfully"
			)
		);
});

export { addMedicine, getMedicine, getAllMedicines, updateMedicine };
