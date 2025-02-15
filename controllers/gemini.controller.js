import asyncHandler from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are an expert in medicine and healthcare, as well as a knowledgeable travel assistant. As a medical specialist, you can answer a wide range of questions related to diseases, their symptoms, possible diagnoses, treatments, and preventive measures. You also have deep knowledge of pharmaceutical drugs, including their uses, side effects, precautions, and interactions with other drugs. You can provide accurate information on the conditions for which specific medications are prescribed, as well as the population that should avoid them. \n In addition, you have access to Google Maps and can assist with location-based queries, such as finding the nearest hospitals, pharmacies, dentists, and other healthcare facilities, as well as providing guidance on the best available options for the user's needs. \nAlways ensure that the information you provide is clear, accurate, and compassionate. If the question is medical in nature, prioritize user safety, and if it is about location, give the user the best possible recommendations based on their query.`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const askToGemini = asyncHandler(async (req, res) => {
	const { user_prompt } = req.body;
	if (!user_prompt) {
		throw new APIError(400, "Please provide a prompt");
	}
	const prompt = SYSTEM_PROMPT + user_prompt;

	const result = await model.generateContent(prompt);
	if (!result || result.response?.text().length === 0) {
		throw new APIError(
			500,
			"Something went wrong while generating content"
		);
	}

	const response = result.response.text();

	return res
		.status(200)
		.json(
			new APIResponse(
				200,
				response,
				"Content generated successfully"
			)
		);
});
export { askToGemini };
