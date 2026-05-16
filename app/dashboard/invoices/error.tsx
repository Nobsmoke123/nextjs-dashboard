"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service.
    console.log(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center text-2xl">Something went wrong!</h2>
      <p>{error.message}</p>
      <button
        className="mt-4 rounded-md bg-blue-600 p-4 text-sm text-white font-bold transition-colors hover:bg-blue-800"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
