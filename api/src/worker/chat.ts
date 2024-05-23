import { Chroma } from "@langchain/community/vectorstores/chroma";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  BaseOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { LLMChain } from "langchain/chains";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { Document } from "langchain/document";
import { pull } from "langchain/hub";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { z } from "zod";
import { embeddings } from "../worker/embedding";
import { LLMModal } from "../worker/llm";
import { RerankModal } from "../worker/rerank";

export const GetAnswer = async (OriginalQuery: string, datasetId: string) => {
  let query = await rephraseQuery(OriginalQuery);
  const t2 = Date.now();
  const results = await Retrive(query, datasetId);
  const t3 = Date.now();
  const reranked = await Rerank(results, query);
  const t4 = Date.now();
  const stream = await LLM(query, reranked);
  return {
    docs: reranked,
    stream,
  };
};

let multiQueryPrompt: PromptTemplate;
let finalLLMPrompt: ChatPromptTemplate;
const LoadTempltes = async () => {
  multiQueryPrompt = await pull("hwchase17/multi-query-retriever");
  finalLLMPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
};
LoadTempltes();

class LineListOutputParser extends BaseOutputParser<LineList> {
  static lc_name() {
    return "LineListOutputParser";
  }

  lc_namespace = ["langchain", "retrievers", "multiquery"];

  async parse(text: string): Promise<LineList> {
    const startKeyIndex = text.indexOf("<questions>");
    const endKeyIndex = text.indexOf("</questions>");
    const questionsStartIndex =
      startKeyIndex === -1 ? 0 : startKeyIndex + "<questions>".length;
    const questionsEndIndex = endKeyIndex === -1 ? text.length : endKeyIndex;
    const lines = text
      .slice(questionsStartIndex, questionsEndIndex)
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");
    return { lines };
  }

  getFormatInstructions(): string {
    throw new Error("Not implemented.");
  }
}

const MultiQueryRetriverFn = async (
  queries: string,
  collectionName: string
) => {
  const db = await Chroma.fromExistingCollection(embeddings, {
    collectionName: collectionName,
  });

  //   return await db.similaritySearch(queries, 15);
  const llmChain = new LLMChain({
    llm: LLMModal,
    prompt: multiQueryPrompt,
    outputParser: new LineListOutputParser(),
  });

  const retriever = new MultiQueryRetriever({
    retriever: db.asRetriever(),
    llmChain,
    queryCount: 2,
    // documentCompressor: LLMChainExtractor.fromLLM(LLMModal),
  });
  const docs = retriever.invoke(queries);
  return docs;
};
const Retrive = async (query: string, collectionName: string) => {
  const multiANS = await MultiQueryRetriverFn(query, collectionName);
  return multiANS;
};

const Rerank = async (docs: Document[], query: string) => {
  const rerankedDocuments = await RerankModal.rerank(docs, query, {
    topN: 5,
  });

  const rerankDocs = rerankedDocuments.map((doc) => {
    const out = docs[doc.index];
    out.metadata.score = doc.relevanceScore;
    return out;
  });
  return rerankDocs;
};
const LLM = async (question: string, documents: Document[]) => {
  const ragChain = await createStuffDocumentsChain({
    llm: LLMModal,
    prompt: finalLLMPrompt,
  });
  const response = await ragChain.stream({
    question: question,
    context: documents,
  });
  return response;
};

const rephraseQuery = async (query: string) => {
  const contextualizeQSystemPrompt = `Given a chat history and the latest user question
      which might reference context in the chat history, formulate a standalone question
      which can be understood without the chat history. Do NOT answer the question,
      just reformulate it if needed and otherwise return it as is.`;

  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);
  const contextualizeQChain = contextualizeQPrompt
    .pipe(LLMModal)
    .pipe(new StringOutputParser());
  const output = await contextualizeQChain.invoke({
    chat_history: [].map((e, idx) => {
      if (idx % 2 === 0) {
        return new HumanMessage(e);
      } else {
        return new AIMessage(e);
      }
    }),

    question: query,
  });

  return output;
};

type LineList = {
  lines: string[];
};
