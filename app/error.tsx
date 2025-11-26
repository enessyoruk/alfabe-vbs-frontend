"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body className="p-6">
        <h2 className="text-xl font-bold mb-4">Bir hata oluştu</h2>

        <p className="text-sm text-red-700">
          {error?.message ?? "Bilinmeyen bir hata oluştu."}
        </p>

        <button
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
          onClick={() => reset()}
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
