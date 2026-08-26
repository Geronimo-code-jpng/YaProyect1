import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppShell from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://yamayorista.com"),
  title: "YA MAYORISTA! | Distribuidor Mayorista",
  description:
    "YA MAYORISTA - Tu distribuidor mayorista de confianza. Amplio catálogo de alimentos, bebidas, lácteos y más.",
  icons: { icon: "/yafavicon.svg", shortcut: "/yafavicon.svg" },
  openGraph: {
    type: "website",
    url: "https://yamayorista.com/",
    title: "YA MAYORISTA! | Distribuidor Mayorista",
    description:
      "YA MAYORISTA - Tu distribuidor mayorista de confianza. Amplio catálogo de alimentos, bebidas, lácteos y más.",
    images: ["/yaicon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "YA MAYORISTA! | Distribuidor Mayorista",
    description:
      "YA MAYORISTA - Tu distribuidor mayorista de confianza. Amplio catálogo de alimentos, bebidas, lácteos y más.",
    images: ["/yaicon.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-K57GXX72');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K57GXX72"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
