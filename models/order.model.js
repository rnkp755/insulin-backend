import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const timeSlotEnums = [
	"00:00 AM - 01:00 AM",
	"01:00 AM - 02:00 AM",
	"02:00 AM - 03:00 AM",
	"03:00 AM - 04:00 AM",
	"04:00 AM - 05:00 AM",
	"05:00 AM - 06:00 AM",
	"06:00 AM - 07:00 AM",
	"07:00 AM - 08:00 AM",
	"08:00 AM - 09:00 AM",
	"09:00 AM - 10:00 AM",
	"10:00 AM - 11:00 AM",
	"11:00 AM - 12:00 PM",
	"12:00 PM - 01:00 PM",
	"01:00 PM - 02:00 PM",
	"02:00 PM - 03:00 PM",
	"03:00 PM - 04:00 PM",
	"04:00 PM - 05:00 PM",
	"05:00 PM - 06:00 PM",
	"06:00 PM - 07:00 PM",
	"07:00 PM - 08:00 PM",
	"08:00 PM - 09:00 PM",
	"09:00 PM - 10:00 PM",
	"10:00 PM - 11:00 PM",
	"11:00 PM - 12:00 AM",
];

const orderSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		items: [
			{
				itemId: {
					type: Schema.Types.ObjectId,
					refPath: "itemType",
					required: true,
				},
				itemType: {
					type: String,
					enum: ["Medicine", "Test"],
					required: true,
				},
				quantity: {
					type: Number,
					default: function () {
						return this.itemType === "Medicine"
							? 1
							: null;
					},
					min: [1, "Quantity must be at least 1"],
				},
				date: {
					type: Date,
					required: function () {
						return this.itemType === "Test";
					},
				},
				timeSlot: {
					type: String,
					enum: {
						values: timeSlotEnums,
						message: "Invalid time slot",
					},
					required: function () {
						return this.itemType === "Test";
					},
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
		},
		addressId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: [
				"Pending",
				"Confirmed",
				"Shipped",
				"Delivered",
				"Cancelled",
			],
			default: "Pending",
		},
		paymentMode: {
			type: String,
			enum: ["COD", "UPI", "Card"],
			required: true,
		},
		paymentStatus: {
			type: String,
			enum: ["Pending", "Success", "Failed"],
			default: "Pending",
		},
	},
	{ timestamps: true }
);

orderSchema.plugin(mongooseAggregatePaginate);
export const Order = mongoose.model("Order", orderSchema);
