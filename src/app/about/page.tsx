
"use client";
import AppLayout from '@/components/layout/AppLayout';

export default function AboutPage() {
  return (
    <AppLayout>
      <main className="flex flex-col flex-grow items-center justify-center p-4 text-center">
        <h2 className="text-3xl font-code text-white">about/hey.hi/readme</h2>
        <p className="text-gray-400 mt-4 max-w-md">
          This section is under construction. Come back soon to learn more about the project!
        </p>
      </main>
    </AppLayout>
  );
}
