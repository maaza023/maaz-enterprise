import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// This initializes the premium geometric font
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maaz Enterprise | Curated Living & Vintage Modern Design",
  description: "Where vintage soul embraces modern elegance. Premium structural design, modern architecture, and curated living spaces by Maaz Enterprise.",
  keywords: ["Maaz Enterprise", "curated living", "vintage modern architecture", "structural design", "premium home styling", "interior elegance"],
  openGraph: {
    title: "Maaz Enterprise | Curated Living & Vintage Modern Design",
    description: "Where vintage soul embraces modern elegance. Premium structural design, modern architecture, and curated living spaces by Maaz Enterprise.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#1F302A]">
      {/* This applies the font to every single page on the website */}
      <body className={`${jakarta.className} min-h-screen bg-[#1F302A] text-[#F3EFE0] antialiased overflow-x-hidden selection:bg-[#E8B49B] selection:text-[#2A3F38]`}>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1F302A',
              color: '#F3EFE0',
              border: '1px solid rgba(243, 239, 224, 0.1)',
              borderRadius: '1rem',
            },
          }} 
        />
        {children}
      </body>
    </html>
  );
}