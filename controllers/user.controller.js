import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = await user.generateAccessToken();
		const refreshToken = await user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new APIError(
			500,
			"Something went wrong while generating Tokens"
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	const { firstName, lastName, mobile, gender, age, email, password } =
		req.body;
	if (
		[
			firstName,
			lastName,
			mobile,
			gender,
			age,
			email,
			password,
		].includes(undefined) ||
		[firstName, lastName, mobile, gender, email, password].some(
			(field) => field.trim() === ""
		) ||
		age < 0
	) {
		throw new APIError(400, "Please provide all the required fields");
	}

	// Other Validations
	const existedUser = await User.findOne({ email });
	if (!existedUser) {
		throw new APIError(
			400,
			"User doesn't exist. Please verify your email first."
		);
	}

	existedUser.firstName = firstName;
	existedUser.lastName = lastName;
	existedUser.mobile = mobile;
	existedUser.gender = gender;
	existedUser.age = age;
	existedUser.password = password;
	const user = await existedUser.save({ validateBeforeSave: true });

	const newUser = await User.findById(user._id).select(
		"-password -refreshToken -__v -createdAt -updatedAt"
	);

	if (!newUser)
		throw new APIError(500, "Something went wrong while creating user");

	return res
		.status(201)
		.json(
			new APIResponse(201, newUser, "User Registered Successfully")
		);
});

const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	console.log("Req body", req.body);

	if (!email) {
		throw new APIError(400, "Email is required");
	}

	if (password === undefined || password === "") {
		throw new APIError(400, "Password is required");
	}

	const user = await User.findOne({ email });

	if (!user) throw new APIError(404, "User doesn't exist");

	const isPasswordValid = await user.isPasswordcorrect(password);

	if (!isPasswordValid) throw new APIError(401, "Invalid User Credentials");

	const { accessToken, refreshToken } =
		await generateAccessAndRefreshTokens(user._id);

	user.refreshToken = refreshToken;

	const loggedInUser = user.toObject();
	delete loggedInUser["_id"];
	delete loggedInUser["password"];
	delete loggedInUser["createdAt"];
	delete loggedInUser["updatedAt"];
	delete loggedInUser["__v"];

	console.log(loggedInUser);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new APIResponse(
				200,
				{
					user,
				},
				"User logged in successfully"
			)
		);
});

const logoutUser = asyncHandler(async (req, res) => {
	console.log("Logout ", req.user._id);
	// Output : Logout  undefined
	const user = await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1,
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new APIResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken =
		req.cookies.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) throw new APIError(401, "Unathorized Access");

	const decodedToken = jwt.verify(
		incomingRefreshToken,
		process.env.REFRESH_TOKEN_SECRET
	);

	if (!decodedToken || !decodedToken["_id"])
		throw new APIError(401, "Unathorized Access");

	const user = await User.findById(decodedToken._id);

	if (!user) throw new APIError(401, "Invalid refresh token");

	if (incomingRefreshToken !== user?.refreshToken)
		throw new APIError(401, "Refesh Token Invalid or Expired");

	try {
		const { newAccessToken, newRefreshToken } =
			await generateAccessAndRefreshTokens(user._id);
		console.log("New Access Token", newAccessToken);

		const options = {
			httpOnly: true,
			secure: true,
		};

		return res
			.status(200)
			.cookie("accessToken", newAccessToken, options)
			.cookie("refreshToken", newRefreshToken, options)
			.json(
				new APIResponse(
					200,
					{
						email: user.email,
						fullName: user.fullName,
						accessToken: newAccessToken,
						refreshToken: newRefreshToken,
					},
					"Session restored Successfully"
				)
			);
	} catch (error) {
		throw new APIError(
			501,
			error?.message || "Error while restarting session"
		);
	}
});

const changeUserPassword = asyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	console.log("Change Password", req.user._id);
	const user = await User.findById(req.user?._id);
	if (!user.isPasswordcorrect(oldPassword))
		throw new APIError(400, "Old Password is incorrect");

	user.password = newPassword;
	await user.save({ validateBeforeSave: true });

	return res
		.status(200)
		.json(new APIResponse(200, {}, "Password Updated Successfully"));
});

const resetPassword = asyncHandler(async (req, res) => {
	const { email, newPassword } = req.body;
	console.log("Reset Password", req.body);

	if (!email) {
		throw new APIError(400, "Email is required");
	}

	const user = await User.findOne({ email });
	if (!user) {
		throw new APIError(400, "User doesn't exist");
	}
	if (!user.allowPasswordReset) {
		throw new APIError(400, "Password reset is not allowed");
	}

	user.password = newPassword;
	user.allowPasswordReset = false;
	await user.save({ validateBeforeSave: true });

	return res
		.status(200)
		.json(new APIResponse(200, {}, "Password Updated Successfully"));
});

export {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	changeUserPassword,
	resetPassword,
};
