import { Outfit, Montserrat } from "next/font/google";
import "./globals.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "GiBravo Travel -- Dashboard di Gestione",
  description: "Sistema di gestione integrale per servizi di viaggi e turismo",
  keywords: "viaggi, turismo, gestione, dashboard, GiBravo Travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${outfit.className} ${montserrat.variable} dark:bg-gray-900`}>
        <ClerkProvider
          signInUrl="/signin"
          signUpUrl="/signin"
          afterSignInUrl="/"
          afterSignOutUrl="/signin"
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
