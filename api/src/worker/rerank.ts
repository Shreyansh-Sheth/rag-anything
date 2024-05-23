import { CohereRerank } from "@langchain/cohere";
import { env } from "process";

export const RerankModal = new CohereRerank({
  apiKey: env.COHERE_KEY, // Default
  model: "rerank-english-v2.0", // Default
});
