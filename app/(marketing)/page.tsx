"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ClerkLoading,
  ClerkLoaded,
  SignedIn,
  SignedOut,
  SignUpButton,
  SignInButton,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

export default function Home() {
  useEffect(() => {
    const hideSplineWatermark = () => {
      const viewer = document.querySelector("spline-viewer");
      if (viewer && viewer.shadowRoot) {
        const logo = viewer.shadowRoot.querySelector("#logo");
        if (logo) {
          (logo as HTMLElement).style.display = "none";
        }
      }
    };

    hideSplineWatermark();
    const interval = setInterval(hideSplineWatermark, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-screen-2xl mx-auto flex-1 w-full flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-12 py-4 lg:py-8 gap-6 lg:gap-10">
      {/*
        Spline strategy:
        - Give spline-viewer a large fixed 1100×900 px canvas so the WebGL
          camera can render the full torus without any edge being cut off.
        - The outer clip wrapper is sized to the visual footprint we want
          (640px × 640px on large screens).
        - CSS scale = visual_size / canvas_size = 640 / 1100 ≈ 0.582
          We use overflow:hidden on the clip wrapper so scaled content
          stays within the flex column, but the inner absolute wrapper
          uses negative margins to stay centered.
      */}
      <div className="flex items-center justify-center w-full lg:w-1/2 flex-1">
        {/* Visual bounding box – sets the space this section occupies in the layout */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: "640px", height: "640px" }}
        >
          {/* Large canvas container centered absolutely so scale shrinks symmetrically */}
          <div
            style={{
              position: "absolute",
              width: "1100px",
              height: "900px",
              transform: "scale(0.58)",
              transformOrigin: "center center",
              pointerEvents: "auto",
            }}
          >
            <Script
              type="module"
              src="https://unpkg.com/@splinetool/viewer@1.10.16/build/spline-viewer.js"
              strategy="lazyOnload"
            />
            <spline-viewer
              url="https://prod.spline.design/lynvnUvpEXErnE8z/scene.splinecode"
              style={{ width: "100%", height: "100%" }}
            ></spline-viewer>
          </div>
          {/* Cover the "Built with Spline" watermark badge (bottom-right of canvas) */}
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              right: "4px",
              width: "180px",
              height: "52px",
              background: "white",
              zIndex: 30,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center lg:items-start gap-y-8 flex-1">
        <h1 className="text-2xl lg:text-4xl font-bold text-neutral-600 max-w-[480px] text-center lg:text-left leading-snug">
          Learn, practice, master native Indian languages with Lexa.
        </h1>
        <div className="flex flex-col items-center gap-y-3 max-w-[330px] w-full">
          <ClerkLoading>
            <Loader className="h-5 w-5 text-muted-foreground animate-spin" />
          </ClerkLoading>
          <ClerkLoaded>
            <SignedOut>
              <SignUpButton
                mode="modal"
                forceRedirectUrl="/learn"
                fallbackRedirectUrl="/learn">
                <Button size="lg" variant="secondary" className="w-full">
                  Get Started
                </Button>
              </SignUpButton>
              <SignInButton
                mode="modal"
                forceRedirectUrl="/learn"
                fallbackRedirectUrl="/learn">
                <Button size="lg" variant="primaryOutline" className="w-full">
                  I already have an account
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href="/learn">
                  Continue Learning
                </Link>
              </Button>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}