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
	pincode: {
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
		required: true,
	},
	landmark: {
		type: String,
	},
});

export const Address = mongoose.model("Address", addressSchema);
