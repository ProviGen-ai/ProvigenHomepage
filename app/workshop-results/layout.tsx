export default function WorkshopResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        footer { display: none !important; }
        section.pb-\\[60px\\] { padding-bottom: 2rem !important; }
      `}</style>
      {children}
    </>
  );
}
