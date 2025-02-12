import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
	{
		firstName: {
			type: String,
			trim: true,
			minLength: [
				2,
				"First name must be at least 2 characters long",
			],
		},
		lastName: {
			type: String,
			trim: true,
			minLength: [
				3,
				"Last name must be at least 2 characters long",
			],
		},
		mobile: {
			type: String,
			minlength: 10,
			maxlength: 10,
			unique: true,
			sparse: true,
			trim: true,
			index: true,
			match: [/^[0-9]{10}$/, "Invalid mobile number"],
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
		},
		age: {
			type: Number,
			min: [0, "Age must be at least 0"],
			max: [120, "Age must be at most 120"],
		},
		email: {
			type: String,
			required: true,
			minlength: 5,
			maxlength: 50,
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
		},
		password: {
			type: String,
			minLength: [8, "Password must be at least 8 characters long"],
			maxLength: [
				16,
				"Password must be at most 16 characters long",
			],
		},
		allowPasswordReset: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		quiz: [
			{
				type: String,
			},
		],
		refreshToken: {
			type: String,
		},
	},
	{ timestamps: true }
);

userSchema.pre("save", async function (next) {
	if (this.isModified("password")) {
		this.password = await bcrypt.hash(this.password, 8);
	}
	next();
});

userSchema.methods.isPasswordcorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
			fullName: this.firstName + " " + this.lastName,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

userSchema.methods.generateRefreshToken = async function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		}
	);
};
export const User = mongoose.model("User", userSchema);
