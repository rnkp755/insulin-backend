import dotenv from "dotenv";
import connectToMongo from "./db/db.js";
import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();

app.use(
	cors({
		origin: "*",
		Credentials: true,
	})
);
app.use(
	express.urlencoded({
		extended: true,
		limit: "16kb",
	})
);
app.use(express.json());
app.use(cookieparser());

// Importing Routes
import userRouter from "./routes/user.route.js";
import otpRouter from "./routes/otp.route.js";
import geminiRouter from "./routes/gemini.route.js";
import medicineRouter from "./routes/medicine.route.js";
import testRouter from "./routes/test.route.js";
import cartRouter from "./routes/cart.route.js";

// Using Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/gemini", geminiRouter);
app.use("/api/v1/medicine", medicineRouter);
app.use("/api/v1/test", testRouter);
app.use("/api/v1/cart", cartRouter);

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
