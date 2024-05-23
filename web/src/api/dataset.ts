import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./main";

export const useCreateDatasetMutation = () => {
  return useMutation({
    mutationFn: async (data) => {
      api.post("/dataset", data);
    },
  });
};

export type Dataset = {
  name: string;
  _id: string;
  files: {
    _id: string;
    name: string;
    indexingStatus: "PENDING" | "IN-PROGRESS" | "COMPLETED" | "FAILED";
  }[];
};
export const useListDatasetQuery = () => {
  return useQuery({
    queryKey: ["dataset"],
    queryFn: async () => {
      const response = await api.get("/dataset");
      return response.data as Dataset[];
    },
    refetchInterval: 1000,
  });
};

export const useGetDatasetQuery = ({ datasetId }: { datasetId: string }) => {
  return useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: async () => {
      return (await api.get<Dataset>(`/dataset/${datasetId}`)).data;
    },
  });
};
