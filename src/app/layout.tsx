import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME || "JobTracker";

export const metadata: Metadata = {
  title: appName,
  description: "Client and project management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('jt-theme');if(t&&t!=='light')document.documentElement.classList.add(t);}catch(e){}` }} />
      </head>
      <body className="h-full flex bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <CommandPalette />
      </body>
    </html>
  );
}
