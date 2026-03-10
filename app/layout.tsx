import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Providers } from "./providers";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProviGen",
  description: "ProviGen - AI-powered experimental design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
