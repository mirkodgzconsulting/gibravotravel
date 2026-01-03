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
  title: "GiBravo Travel",
  description: "Sistema di gestione integrale per servizi di viaggi e turismo",
  keywords: "viaggi, turismo, gestione, dashboard, GiBravo Travel",
  icons: {
    icon: "/images/logo/cropped-faviconWeb.png",
    apple: "/images/logo/cropped-faviconWeb.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${outfit.className} ${montserrat.variable} bg-white`}>
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
        {/* Global GoHighLevel Form Script */}
        <script src="https://link.msgsndr.com/js/form_embed.js" defer></script>
      </body>
    </html>
  );
}
