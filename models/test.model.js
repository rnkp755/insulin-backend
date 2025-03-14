import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const testSchema = new Schema(
	{
		clinicId: {
			type: Schema.Types.ObjectId,
			ref: "Clinic",
			default: null,
		},
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
		images: [
			{
				type: String,
				required: true,
			},
		],
	},
	{ timestamps: true }
);

testSchema.plugin(mongooseAggregatePaginate);
export const Test = mongoose.model("Test", testSchema);
