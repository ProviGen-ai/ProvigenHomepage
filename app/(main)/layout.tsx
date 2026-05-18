import Header from "@/components/variants/eka/Header";
import Footer from "@/components/variants/eka/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
