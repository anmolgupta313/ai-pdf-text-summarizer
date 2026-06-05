import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "./Redux/provider";
import { AuthProvider } from "@/Components/AuthProvider";
import Navbar from "@/Components/Navbar";
import Script from "next/script";
import ThemeProviderWrapper from "@/Components/theme/themeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PDF Summarizer",
  description: "Summarize and chat with your PDFs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProviderWrapper>
          <AuthProvider>
            <ReduxProvider>
              <Navbar />
              {children}
            </ReduxProvider>
          </AuthProvider>
        </ThemeProviderWrapper>

        <Script
          src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
