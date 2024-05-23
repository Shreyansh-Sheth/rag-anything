import { OpenAI } from "@langchain/openai";
import { env } from "process";

export const LLMModal = new OpenAI({
  model: "gpt-3.5-turbo",
  openAIApiKey: env.OPEN_AI_KEY,
  temperature: 0.3,
  streaming: true,
});
