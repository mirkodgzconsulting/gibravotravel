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
  metadataBase: new URL("https://www.gibravo.it"),
  title: {
    default: "GiBravo Travel | Viaggi Organizzati in Bus e Aereo",
    template: "%s | GiBravo Travel"
  },
  description: "Scopri le migliori destinazioni con GiBravo Travel. Viaggi organizzati in pullman e aereo, tour guidati e vacanze indimenticabili in Italia e Europa.",
  keywords: ["viaggi organizzati", "tour in bus", "viaggi aereo", "agenzia viaggi milano", "gibravo travel", "vacanze gruppo"],
  authors: [{ name: "GiBravo Travel" }],
  creator: "GiBravo Travel",
  publisher: "GiBravo Travel",
  openGraph: {
    title: "GiBravo Travel | Viaggi Organizzati in Bus e Aereo",
    description: "Viaggi organizzati in pullman e aereo, tour guidati e vacanze indimenticabili.",
    url: "https://www.gibravo.it",
    siteName: "GiBravo Travel",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/images/logo/logo-gibravo.png", // Fallback image (needs verification if exists, otherwise defaults to something else)
        width: 1200,
        height: 630,
        alt: "GiBravo Travel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GiBravo Travel",
    description: "Scopri le migliori destinazioni con GiBravo Travel.",
    creator: "@gibravotravel", // Placeholder if they have one, safe to leave or generic
  },
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
