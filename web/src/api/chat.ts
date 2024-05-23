import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./main";

type ResponseType = {
  response: string;
  citations: {
    content: string;
    fileName: string;
  }[];
};

type ChatType = {
  data: string;
  content?: {
    text: string;
    fileName: string;
  }[];

  role: "bot" | "user";
  _id: string;
};
export const useGetChat = ({ datasetId }: { datasetId: string }) => {
  return useQuery({
    queryKey: ["chat", datasetId],
    queryFn: async () => {
      return (await api.get<{ data: ChatType[] }>(`/chat/${datasetId}`)).data
        .data;
    },
  });
};

export const useAskQuestionMutation = () => {
  /// NOTE: not currently used as react-query does not support streaming output yet
  return useMutation({
    mutationFn: async ({
      datasetId,
      question,
    }: {
      datasetId: string;
      question: string;
    }) => {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        body: JSON.stringify({
          datasetId,
          question,
        }),
      });
      let decoder = new TextDecoder();
      let reader = res.body?.getReader();
      if (!reader) return;
      reader.read().then(function processResult(result): any {
        if (result.done) return;
        console.log(decoder.decode(result.value, { stream: true }));
        return reader.read().then(processResult);
      });
      //log stream
    },
  });
};
