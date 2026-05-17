"use client";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    inquiryType: "",
    email: "",
    message: "",
    website: "", // honeypot field
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send");

      setStatus("sent");
      setFormData({ inquiryType: "", email: "", message: "", website: "" });
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Auto-resize textarea
    if (e.target instanceof HTMLTextAreaElement) {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }
  };

  const labelClass = "block mb-3 font-mono text-xs uppercase tracking-wider text-white/40";
  const inputClass = "w-full px-0 py-3 bg-transparent border-0 border-b border-white/15 text-white placeholder-white/20 focus:outline-none focus:border-warm-tan/50 transition-colors";

  return (
    <section id="contact" className="pt-20 lg:pt-28 pb-32 lg:pb-48 bg-[#0a0a0a]">
      {/* Copper accent border */}
      <div className="mx-auto max-w-3xl px-8 mb-16">
        <div className="border-t border-warm-tan/30" />
      </div>
      <div className="mx-auto max-w-3xl px-8">
        <form onSubmit={handleSubmit} className="text-left max-w-lg mx-auto">
          <p className="text-sm font-mono uppercase text-warm-tan tracking-[0.3em] mb-12 text-center">
            Contact
          </p>
          <h2 className="text-heading-sm lg:text-heading text-white font-medium mb-6">
            Get in touch
          </h2>
          <p className="text-white/50 leading-relaxed mb-16 font-mono text-base">
            Tell us what you&apos;re working on.<br />Whether you have automation infrastructure or are just starting out, we&apos;d love to hear from you.
          </p>

          {/* Honeypot field */}
          <div className="absolute opacity-0 top-0 left-0 h-0 w-0 -z-10" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="inquiryType" className={labelClass}>
              Inquiry Type
            </label>
            <select
              id="inquiryType"
              name="inquiryType"
              value={formData.inquiryType}
              onChange={handleChange}
              className={`${inputClass} appearance-none cursor-pointer`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='rgba(184,149,106,0.5)' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
            >
              <option value="" className="bg-[#1a1a2e] text-white/40">Select type</option>
              <option value="partnership" className="bg-[#1a1a2e] text-white">Partnership</option>
              <option value="public-sector" className="bg-[#1a1a2e] text-white">Public Sector</option>
              <option value="investor" className="bg-[#1a1a2e] text-white">Investor</option>
              <option value="media" className="bg-[#1a1a2e] text-white">Media</option>
              <option value="careers" className="bg-[#1a1a2e] text-white">Careers</option>
              <option value="other" className="bg-[#1a1a2e] text-white">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className="mb-12 relative">
            <label htmlFor="message" className={labelClass}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className={`${inputClass} resize-none overflow-hidden`}
            />
            {/* Resize grip */}
            <svg className="absolute bottom-2 right-0 w-3 h-3 pointer-events-none" viewBox="0 0 12 12">
              <line x1="11" y1="1" x2="1" y2="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <line x1="11" y1="4.5" x2="4.5" y2="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              <line x1="11" y1="8" x2="8" y2="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            </svg>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#0a0a0a] px-10 py-4 text-sm font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "SEND MESSAGE"}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          {status === "sent" && (
            <p className="mt-6 text-sm text-green-400">
              Message sent successfully! We&apos;ll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="mt-6 text-sm text-red-400">
              Something went wrong. Please try again or email us directly.
            </p>
          )}
        </form>

        <div className="mt-16 pt-8 text-center">
          <a
            href="mailto:contact@provigen.ai"
            className="font-mono text-base text-warm-tan hover:text-warm-tan/80 transition-colors"
          >
            contact@provigen.ai
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
