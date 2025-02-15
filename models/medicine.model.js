import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			index: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		quantityInStock: {
			type: Number,
			required: true,
		},
		stripSize: {
			type: Number,
		},
		images: [
			{
				type: String,
				required: true,
			},
		],
	},
	{ timestamps: true }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);
