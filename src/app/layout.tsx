import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/lib/UserContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Exploration Tracker - Caddy",
  description: "Internal tool for tracking structured industry exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <UserProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-56 p-6">
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
