const Problem = () => {
  return (
    <section id="mission" className="relative py-40 lg:py-56 bg-off-white overflow-hidden">
      {/* Subtle network graphic behind text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          width="400"
          height="400"
          viewBox="0 0 400 400"
          fill="none"
          className="opacity-[0.025]"
        >
          {/* Network nodes and edges */}
          <circle cx="200" cy="60" r="6" fill="#1a1a1a" />
          <circle cx="120" cy="120" r="5" fill="#1a1a1a" />
          <circle cx="280" cy="120" r="5" fill="#1a1a1a" />
          <circle cx="80" cy="200" r="6" fill="#1a1a1a" />
          <circle cx="200" cy="200" r="8" fill="#1a1a1a" />
          <circle cx="320" cy="200" r="6" fill="#1a1a1a" />
          <circle cx="120" cy="280" r="5" fill="#1a1a1a" />
          <circle cx="280" cy="280" r="5" fill="#1a1a1a" />
          <circle cx="200" cy="340" r="6" fill="#1a1a1a" />
          <circle cx="60" cy="140" r="4" fill="#1a1a1a" />
          <circle cx="340" cy="140" r="4" fill="#1a1a1a" />
          <circle cx="60" cy="260" r="4" fill="#1a1a1a" />
          <circle cx="340" cy="260" r="4" fill="#1a1a1a" />
          <line x1="200" y1="60" x2="120" y2="120" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="200" y1="60" x2="280" y2="120" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="120" y1="120" x2="80" y2="200" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="120" y1="120" x2="200" y2="200" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="280" y1="120" x2="200" y2="200" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="280" y1="120" x2="320" y2="200" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="80" y1="200" x2="120" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="200" y1="200" x2="120" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="200" y1="200" x2="280" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="320" y1="200" x2="280" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="120" y1="280" x2="200" y2="340" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="280" y1="280" x2="200" y2="340" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="60" y1="140" x2="120" y2="120" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="340" y1="140" x2="280" y2="120" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="60" y1="260" x2="120" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="340" y1="260" x2="280" y2="280" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="80" y1="200" x2="200" y2="200" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="200" y1="200" x2="320" y2="200" stroke="#1a1a1a" strokeWidth="1" />
        </svg>
      </div>

      {/* Centered mission text */}
      <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
        <h2 className="text-heading-sm lg:text-heading text-charcoal mb-16 font-medium">
          We automate the scientific method
          <br />
          for the physical world.
        </h2>

        <div className="space-y-8 text-lg lg:text-xl text-mid-gray leading-relaxed max-w-xl mx-auto">
          <p>
            Lab automation has always meant a tradeoff
            <br />
            between speed and reliability.
          </p>

          <p className="text-charcoal font-medium">
            Our closed-loop AI platform eliminates that tradeoff.
          </p>

          <p>
            It combines{" "}
            <span className="text-charcoal">intelligent design</span>,{" "}
            <span className="text-charcoal">autonomous execution</span>,{" "}
            and <span className="text-charcoal">real-time learning</span> to
            cut optimization timelines from months to weeks.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
