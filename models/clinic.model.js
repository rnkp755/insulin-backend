import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const clinicSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			index: true,
		},
		medicalServices: [
			{
				type: Schema.Types.ObjectId,
				ref: "Test",
			},
		],
		address: {
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
					"Andaman and Nicobar Islands",
					"Chandigarh",
					"Dadra and Nagar Haveli and Daman and Diu",
					"Lakshadweep",
					"Delhi",
					"Puducherry",
					"Ladakh",
					"Jammu and Kashmir",
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
		},
		description: {
			type: String,
			required: true,
		},
		website: {
			type: String,
			default: "",
		},
		openingTime: {
			hour: Number,
			minute: Number,
			meridian: {
				type: String,
				enum: ["AM", "PM"],
			},
		},
		closingTime: {
			hour: Number,
			minute: Number,
			meridian: {
				type: String,
				enum: ["AM", "PM"],
			},
		},
		images: [
			{
				type: String,
			},
		],
	},
	{ timestamps: true }
);

clinicSchema.plugin(mongooseAggregatePaginate);
export const Clinic = mongoose.model("Clinic", clinicSchema);
