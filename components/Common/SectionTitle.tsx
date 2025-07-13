const SectionTitle = ({
  title,
  paragraph,
  width = "620px",
  paragraphWidth,
  center,
  mb = "100px",
}: {
  title: string;
  paragraph: string | React.ReactNode;
  width?: string;
  paragraphWidth?: string;
  center?: boolean;
  mb?: string;
}) => {
  return (
    <>
      <div
        className={`wow fadeInUp w-full ${center ? "mx-auto text-center" : ""}`}
        data-wow-delay=".1s"
        style={{ maxWidth: paragraphWidth ? "none" : width, marginBottom: mb }}
      >
        <h2 
          className="mb-4 text-3xl font-bold !leading-tight sm:text-4xl md:text-[45px] text-transparent bg-clip-text bg-gradient-to-r from-black to-blue"
          style={paragraphWidth ? { maxWidth: width, margin: center ? "0 auto 1rem auto" : "0 0 1rem 0" } : {}}
        > 
          {title}
        </h2>
        <p 
          className="text-base !leading-relaxed text-body-color-dark md:text-lg"
          style={paragraphWidth ? { maxWidth: paragraphWidth, margin: center ? "0 auto" : "0", whiteSpace: "pre-line" } : { whiteSpace: "pre-line" }}
        >
          {paragraph}
        </p>
      </div>
    </>
  );
};

export default SectionTitle;
//font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black to-blue