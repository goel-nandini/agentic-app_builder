import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dm_sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodex - Next-Gen AI App Builder",
  description: "Build full-stack React web apps from a single prompt with Nodex AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={dark as any}>
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${lora.variable} ${dm_sans.variable} font-sans min-h-screen bg-[#070709] text-white antialiased`}>
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html> 
  </ClerkProvider>
  );
}

