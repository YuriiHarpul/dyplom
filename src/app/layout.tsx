import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Система моніторингу робіт кафедри",
  description: "Система моніторингу та керування процесом підготовки дипломних робіт",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
