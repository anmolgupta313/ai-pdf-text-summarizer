"use client";
import TextInputSummarizer from "@/Components/TextInputSummarizer";
import { useAuth } from "@/Components/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex  dark:bg-black items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-[100%]">
        <div className="w-[100%]">
          <TextInputSummarizer user={user} />
        </div>
      </main>
    </div>
  );
}
