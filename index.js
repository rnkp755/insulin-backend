import dotenv from "dotenv";
import connectToMongo from "./db/db.js";
import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();

app.use(
	cors({
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);
app.use(
	express.urlencoded({
		extended: true,
		limit: "10mb",
	})
);
app.use(cookieparser());

// IMporting Webhook
import webhookRouter from "./routes/webhook.route.js";
app.use("/api/v1/webhook", webhookRouter);


app.use(express.json());

// Importing Routes
import userRouter from "./routes/user.route.js";
import otpRouter from "./routes/otp.route.js";
import geminiRouter from "./routes/gemini.route.js";
import medicineRouter from "./routes/medicine.route.js";
import testRouter from "./routes/test.route.js";
import cartRouter from "./routes/cart.route.js";
import addressRouter from "./routes/address.route.js";
import orderRouter from "./routes/order.route.js";
import clinicRouter from "./routes/clinic.route.js";

// Using Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/gemini", geminiRouter);
app.use("/api/v1/medicine", medicineRouter);
app.use("/api/v1/test", testRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/address", addressRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/clinic", clinicRouter);

connectToMongo()
	.then(() => {
		app.on("error", (error) => {
			console.log("MongoDB Connection Failed !!");
			throw error;
		});
		app.listen(process.env.PORT || 3000, () => {
			console.log(
				`Server is listening on PORT ${
					process.env.PORT || 3000
				}`
			);
		});
	})
	.catch((error) => {
		console.log("MongoDB Connection Failed !!");
	});
