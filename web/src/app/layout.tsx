// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { Roboto } from "next/font/google";

import { Button, ColorSchemeScript, MantineProvider } from "@mantine/core";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
} from "@clerk/nextjs";
import Header from "./header";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ClientProviders from "./providers";
export const metadata = {
  title: "RAG anything",
  description: "Ingest Any Data Into Rag And Chat With It.",
};

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultValue={"dark"} />
      </head>

      <body>
        <ClerkProvider>
          <ClientProviders>
            <MantineProvider
              theme={{
                primaryColor: "dark",
                fontFamily: roboto.style.fontFamily,
              }}
            >
              <Header>{children}</Header>
            </MantineProvider>
          </ClientProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
