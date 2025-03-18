import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import { Clinic } from "../models/clinic.model.js";
import { Test } from "../models/test.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const addClinic = asyncHandler(async (req, res) => {
	const {
		name,
		medicalServices,
		address,
		description,
		website,
		openingTime,
		closingTime,
	} = req.body;
	if (
		[name, address, description, openingTime, closingTime].includes(
			undefined
		) ||
		[name, description].some((field) => field.trim() === "")
	) {
		throw new APIError(400, "Please provide all the required fields");
	}

	const user = await User.findById(req.user?._id);
	if (!user || user?.role !== "admin") {
		throw new APIError(404, "Unauthorized Access");
	}

	let images = [];

	if (req.files && req.files.length > 0) {
		const imageUploadPromises = req.files.map(async (file) => {
			const response = await uploadOnCloudinary(file.path);
			if (!response) {
				throw new APIError(500, "Failed to upload images");
			}
			return response.url;
		});
		images = await Promise.all(imageUploadPromises);
	}

	const clinic = new Clinic({
		name,
		medicalServices: medicalServices || [],
		address,
		description,
		website: website || "",
		openingTime,
		closingTime,
		images,
	});

	await clinic.save({ validateBeforeSave: true });

	const existedClinic = await Clinic.findById(clinic._id).select(
		"-__v -createdAt -updatedAt"
	);

	if (!existedClinic) {
		throw new APIError(500, "Failed to save clinic");
	}

	if (medicalServices && medicalServices.length > 0) {
		medicalServices.forEach(async (serviceId) => {
			const test = await Test.findByIdAndUpdate(
				serviceId,
				{ clinicId: existedClinic._id },
				{ new: true, runValidators: true }
			);
			if (!test) {
				throw new APIError(500, "Failed to save test");
			}
		});
	}

	return res
		.status(201)
		.json(
			new APIResponse(
				201,
				existedClinic,
				"Clinic Created Successfully"
			)
		);
});

const getClinic = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!id) {
		throw new APIError(400, "Please provide clinicId");
	}

	const clinic = await Clinic.findById(id).select(
		"-__v -createdAt -updatedAt"
	);
	if (!clinic) {
		throw new APIError(404, "No Clinic Found");
	}

	return res.status(200).json(new APIResponse(200, clinic, "Clinic Found"));
});

const getAllClinics = asyncHandler(async (req, res) => {
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
	const [clinics, totalClinics] = await Promise.all([
		Clinic.find(queryOptions, null, options),
		Clinic.countDocuments(queryOptions),
	]);

	if (!clinics || clinics.length === 0) {
		throw new APIError(404, "No Tests Found");
	}

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				{ clinics, totalClinics },
				"Tests fetched successfully"
			)
		);
});

const updateClinic = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const {
		name,
		medicalServices,
		address,
		description,
		website,
		openingTime,
		closingTime,
	} = req.body;

	if (
		!name &&
		!address &&
		!description &&
		!openingTime &&
		!closingTime &&
		medicalServices.length === 0
	) {
		throw new APIError(
			400,
			"Please provide at least one field to update"
		);
	}

	const user = await User.findById(req.user?._id);
	if (!user || user?.role !== "admin") {
		throw new APIError(404, "Unauthorized Access");
	}

	const clinic = await Clinic.findById(id);
	if (!clinic) {
		throw new APIError(404, "No Clinic Found");
	}

	let images = [];

	if (req.files && req.files.length > 0) {
		const imageUploadPromises = req.files.map(async (file) => {
			const response = await uploadOnCloudinary(file.path);
			if (!response) {
				throw new APIError(500, "Failed to upload images");
			}
			return response.url;
		});
		images = await Promise.all(imageUploadPromises);
	}

	const prevMedicalServices = clinic.medicalServices.map((id) =>
		id.toString()
	);

	if (name) {
		clinic.name = name;
	}
	if (medicalServices) {
		clinic.medicalServices = medicalServices;
	}
	if (address) {
		clinic.address = address;
	}
	if (description) {
		clinic.description = description;
	}
	if (website) {
		clinic.website = website;
	}
	if (openingTime) {
		clinic.openingTime = openingTime;
	}
	if (closingTime) {
		clinic.closingTime = closingTime;
	}
	if (images.length > 0) {
		clinic.images = images;
	}

	await clinic.save({ validateBeforeSave: true });

	if (medicalServices && medicalServices.length > 0) {
		const servicesToAdd = medicalServices.filter(
			(serviceId) => !prevMedicalServices.includes(serviceId)
		);
		const servicesToRemove = prevMedicalServices.filter(
			(serviceId) => !medicalServices.includes(serviceId)
		);

		console.log("Prev:", prevMedicalServices);
		console.log("Add:", servicesToAdd, "\nRemove: ", servicesToRemove);

		// Add new services
		await Promise.all(
			servicesToAdd.map(async (serviceId) => {
				const test = await Test.findByIdAndUpdate(
					serviceId,
					{ clinicId: clinic._id },
					{ new: true, runValidators: true }
				);
				if (!test) {
					throw new APIError(
						500,
						`Failed to assign test ${serviceId}`
					);
				}
			})
		);

		// Remove unlinked services
		await Promise.all(
			servicesToRemove.map(async (serviceId) => {
				const test = await Test.findByIdAndUpdate(
					serviceId,
					{ clinicId: null },
					{ new: true, runValidators: true }
				);
				if (!test) {
					throw new APIError(
						500,
						`Failed to unassign test ${serviceId}`
					);
				}
			})
		);
	}

	return res
		.status(200)
		.json(new APIResponse(200, clinic, "Clinic Updated Successfully"));
});

export { addClinic, getClinic, getAllClinics, updateClinic };
