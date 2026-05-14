import ScrollToTop from "@/components/ScrollToTop";
import { Providers } from "./providers";
import { VariantProvider } from "@/components/VariantSwitcher/context";
import VariantLayout from "@/components/VariantSwitcher/VariantLayout";
import Switcher from "@/components/VariantSwitcher/Switcher";
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
          <VariantProvider>
            <VariantLayout>
              {children}
            </VariantLayout>
            <Switcher />
            <ScrollToTop />
          </VariantProvider>
        </Providers>
      </body>
    </html>
  );
}
