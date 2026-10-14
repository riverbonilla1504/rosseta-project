import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// La CSP lleva un nonce nuevo por petición (middleware.ts): una página prerenderizada no lo
// tendría y sus scripts quedarían bloqueados. Todo se renderiza de forma dinámica (research V8).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rosetta · Motor de evidencia",
  description: "Catálogo de datos confiable y auditable para bases heredadas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
