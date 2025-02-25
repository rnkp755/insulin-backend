import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Test } from "../models/test.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const addTest = asyncHandler(async (req, res) => {
	const { name, description, price } = req.body;
	if (
		[name, description, price].includes(undefined) ||
		[name, description, price].some((field) => field.trim() === "") ||
		price < 0
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

	const test = new Test({
		name,
		description,
		price,
		images,
	});

	await test.save({ validateBeforeSave: true });

	const existedTest = await Test.findById(test._id).select(
		"-__v -createdAt -updatedAt"
	);
	if (!existedTest) {
		throw new APIError(500, "Failed to save test");
	}

	return res
		.status(201)
		.json(
			new APIResponse(201, existedTest, "Test Created Successfully")
		);
});

const getTest = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const test = await Test.findById(id).select("-__v -createdAt -updatedAt");
	if (!test) {
		throw new APIError(404, "No Test Found");
	}
	return res
		.status(200)
		.json(new APIResponse(201, test, "Test Found Successfully"));
});

const getAllTests = asyncHandler(async (req, res) => {
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
	const [tests, totalTests] = await Promise.all([
		Test.find(queryOptions, null, options),
		Test.countDocuments(queryOptions),
	]);

	if (!tests || tests.length === 0) {
		throw new APIError(404, "No Tests Found");
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ tests, totalTests },
				"Tests fetched successfully"
			)
		);
});

const updateTest = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { name, description, price } = req.body;
	const test = await Test.findById(id);
	if (!test) {
		throw new APIError(404, "No Test Found");
	}
	if (name !== undefined && name.trim() !== "" && test.name !== name) {
		test.name = name;
	}
	if (
		description !== undefined &&
		description.trim() !== "" &&
		test.description !== description
	) {
		test.description = description;
	}
	if (price !== undefined && price > 0 && test.price !== price) {
		test.price = price;
	}

	await test.save({ validateBeforeSave: true });

	const updatedTest = await Test.findById(test._id).select(
		"-__v -createdAt -updatedAt"
	);

	return res
		.status(200)
		.json(
			new APIResponse(200, updatedTest, "Test Updated Successfully")
		);
});

export { addTest, getTest, getAllTests, updateTest };
