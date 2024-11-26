import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import React from "react";


const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "600"] });




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${poppins.className}`}>{children}</body>
    </html>
  );
}
