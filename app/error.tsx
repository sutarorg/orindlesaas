"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="bg-soft py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-xl rounded-[24px] border border-line bg-white p-8 text-center sm:p-10">
          <CircleAlert aria-hidden="true" className="mx-auto size-6 text-teal" />
          <h1 className="mb-0 mt-6 font-display text-3xl font-semibold tracking-[-0.04em]">This page could not be loaded.</h1>
          <p className="mb-0 mt-4 text-sm leading-7 text-body">Try rendering the page again. If the problem continues, return to the homepage or visit the contact preview.</p>
          <Button type="button" onClick={reset} className="mt-7"><RotateCcw aria-hidden="true" /> Try again</Button>
        </div>
      </Container>
    </main>
  );
}
