import "dotenv/config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "process";
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPEN_AI_KEY,
  model: "text-embedding-3-small",
});
