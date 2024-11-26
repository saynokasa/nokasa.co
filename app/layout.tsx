import type { Metadata } from "next";
import { Inter,Averia_Serif_Libre } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });
const aveira=Averia_Serif_Libre({ weight:["300","400","700"],subsets:["latin"] });

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
      <body className={`${inter.className} ${aveira.className}`}>
      {children}
      </body>
    </html>
  );
}
