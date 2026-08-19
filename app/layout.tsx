import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";

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
  title: "Forge - AI App Builder",
  description: "Build AI apps in minutes",
  icons: {
    icon: "/logo-short.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.variable} ${dm_sans.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
        >
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html> 
  </ClerkProvider>
  );
}

