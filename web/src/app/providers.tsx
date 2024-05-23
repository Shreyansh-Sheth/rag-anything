"use client";
import { api } from "@/api/main";
import { useAuth } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();

  useEffect(() => {}, [auth]);

  api.interceptors.request.use(async (config) => {
    const token = await auth.getToken();
    if (!token) {
      return config;
    }
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
