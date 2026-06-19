import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const fontSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fontMono = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevSpace — Real-Time Developer Playground",
  description: "A real-time collaborative code editor platform for developers.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} antialiased dark`}
    >
      <body className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden">
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'rgba(9, 9, 11, 0.9)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'var(--font-inter), sans-serif',
                backdropFilter: 'blur(8px)',
              },
              success: {
                iconTheme: {
                  primary: '#00f0ff',
                  secondary: '#09090b',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#09090b',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
