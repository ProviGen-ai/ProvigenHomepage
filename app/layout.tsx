import ScrollToTop from "@/components/ScrollToTop";
import { Providers } from "./providers";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://provigen.ai"),
  title: "ProviGen — AI-Powered Experimental Design",
  description: "ProviGen - AI-powered experimental design",
  applicationName: "ProviGen",
  openGraph: {
    title: "ProviGen - AI-Powered Experimental Design",
    description: "ProviGen - AI-powered experimental design",
    siteName: "ProviGen",
    url: "https://provigen.ai",
    type: "website",
  },
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
          {children}
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
