export default function WorkshopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        footer { display: none !important; }
        section.pb-\\[120px\\] { padding-bottom: 2rem !important; }
      `}</style>
      {children}
    </>
  );
}
