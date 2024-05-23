"use client";
import {
  RedirectToSignIn,
  SignOutButton,
  SignedIn,
  SignedOut,
  useAuth,
  SignIn,
  useSignIn,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Button,
  Flex,
  Group,
  Title,
} from "@mantine/core";

export default function Header({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { signIn } = useSignIn();
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShellHeader>
        <Flex align="center" h={"100%"} px={30} justify="space-between">
          <Title order={2}>RAG anything</Title>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </Flex>
      </AppShellHeader>
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
