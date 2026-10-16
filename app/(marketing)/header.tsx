import Image from "next/image";
import { Loader } from "lucide-react";
import {
  ClerkProvider,
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="h-20 w-full border-b-2 border-slate-200 px-4 sm:px-8 lg:px-12">
      <div className="w-full flex items-center justify-between h-full">
        <div className="flex items-center gap-x-6">
          <Image
            src="/mascot_logo.svg"
            alt="Logo"
            width={48}
            height={48}
          />
          <h1 className="text-2xl font-extrabold text-yellow-700 tracking-wide">Lexa</h1>
        </div>
        <ClerkProvider>
          <ClerkLoading>
            <Loader className="h-5 w-5 text-muted-foreground animate-spin" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"

              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="lg" variant="ghost">
                  Login
                </Button>
              </SignInButton>
            </SignedOut>

          </ClerkLoaded>
        </ClerkProvider>
      </div>
    </header>
  );
}