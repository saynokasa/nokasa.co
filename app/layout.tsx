import type { Metadata } from "next";
import { Inter, Averia_Serif_Libre } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const aveira = Averia_Serif_Libre({ weight: ["300", "400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Say No to Kasa with NoKasa",
  description:
    "At NoKasa, we boost recycling by bringing together consumers, q-commerce apps and scrap dealers.",
  metadataBase: new URL("https://nokasa.co/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-PMKDWJF4');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={`${inter.className} ${aveira.className}`}>
        {/* Google Tag Manager (noscript) */}
      <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PMKDWJF4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
      </body>
    </html>
  );
}
