import { SignIn, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button, Stack } from "@mantine/core";
import Link from "next/link";

export default function Home() {
  return (
    <Stack>
      <SignedIn>
        <Button component={Link} href="/chat/new">
          Dashboard
        </Button>
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </Stack>
  );
}
