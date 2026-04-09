import type { ReactNode } from "react";
import Footer from "./Footer";
import TopNav from "./TopNav";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pt-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
