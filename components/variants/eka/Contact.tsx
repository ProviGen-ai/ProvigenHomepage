"use client";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
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
      setFormData({ email: "", message: "", website: "" });
    } catch {
      setStatus("error");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-32 lg:py-48 bg-off-white">
      {/* Copper accent border */}
      <div className="mx-auto max-w-3xl px-8 mb-20">
        <div className="border-t border-warm-tan/30" />
      </div>
      <div className="mx-auto max-w-3xl px-8 text-center">
        <span className="font-mono text-label uppercase text-warm-tan tracking-[0.3em] mb-6 block">
          Contact
        </span>
        <h2 className="text-heading-sm lg:text-heading text-charcoal font-medium mb-6">
          Let&#39;s build something together
        </h2>
        <p className="text-mid-gray leading-relaxed mb-16 max-w-xl mx-auto font-mono text-sm">
          Tell us about your process.
          We&apos;ll show you how ProviGen can transform your workflows.
        </p>

        <form onSubmit={handleSubmit} className="text-left max-w-lg mx-auto">
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
            <label htmlFor="email" className="block mb-2 font-mono text-xs uppercase tracking-wider text-mid-gray">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-0 py-3 bg-transparent border-0 border-b border-light-gray text-charcoal placeholder-mid-gray/50 focus:outline-none focus:border-charcoal transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div className="mb-10">
            <label htmlFor="message" className="block mb-2 font-mono text-xs uppercase tracking-wider text-mid-gray">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-0 py-3 bg-transparent border-0 border-b border-light-gray text-charcoal placeholder-mid-gray/50 focus:outline-none focus:border-charcoal transition-colors resize-none"
              placeholder="Tell us about your project..."
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-charcoal text-white px-10 py-4 text-sm font-medium hover:bg-near-black transition-all duration-300 disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "SEND MESSAGE"}
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          {status === "sent" && (
            <p className="mt-6 text-center text-sm text-green-600">
              Message sent successfully! We&apos;ll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="mt-6 text-center text-sm text-red-500">
              Something went wrong. Please try again or email us directly.
            </p>
          )}
        </form>

        <div className="mt-16 pt-8">
          <a
            href="mailto:contact@provigen.ai"
            className="font-mono text-sm text-mid-gray hover:text-charcoal transition-colors inline-flex items-center gap-2"
          >
            contact@provigen.ai <span>&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
