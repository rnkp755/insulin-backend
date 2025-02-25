import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	mobile: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	city: {
		type: String,
		required: true,
	},
	state: {
		type: String,
		enum: [
			"Andhra Pradesh",
			"Arunachal Pradesh",
			"Assam",
			"Bihar",
			"Chhattisgarh",
			"Goa",
			"Gujarat",
			"Haryana",
			"Himachal Pradesh",
			"Jharkhand",
			"Karnataka",
			"Kerala",
			"Madhya Pradesh",
			"Maharashtra",
			"Manipur",
			"Meghalaya",
			"Mizoram",
			"Nagaland",
			"Odisha",
			"Punjab",
			"Rajasthan",
			"Sikkim",
			"Tamil Nadu",
			"Telangana",
			"Tripura",
			"Uttar Pradesh",
			"Uttarakhand",
			"West Bengal",
		],
	},
	pincode: {
		type: String,
		minlength: 6,
		maxlength: 6,
		trim: true,
		match: [/^[0-9]{6}$/, "Invalid pincode"],
	},
	landmark: {
		type: String,
	},
});

export const Address = mongoose.model("Address", addressSchema);
