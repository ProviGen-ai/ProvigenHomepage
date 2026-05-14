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
    <section id="contact" className="py-32 lg:py-40 bg-navy text-white relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-navy-light/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left: Copy */}
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-4">
              Contact
            </p>
            <h2 className="text-heading-sm lg:text-heading text-white mb-6">
              Ready to accelerate your research?
            </h2>
            <p className="text-lg text-white/50 leading-relaxed mb-8">
              Tell us about your lab automation challenges. We&apos;ll show you how
              ProviGen can transform your experimental workflows.
            </p>
            <div className="flex items-center gap-3 text-white/40">
              <span className="text-sm">Or reach us directly at</span>
              <a
                href="mailto:contact@provigen.ai"
                className="text-logo-blue hover:text-white transition-colors font-medium"
              >
                contact@provigen.ai
              </a>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <form
              onSubmit={handleSubmit}
              className="bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 p-8 lg:p-10"
            >
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
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-white/70">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-logo-blue/50 focus:ring-1 focus:ring-logo-blue/30 transition-all"
                  placeholder="name@example.com"
                />
              </div>

              <div className="mb-8">
                <label htmlFor="message" className="block mb-2 text-sm font-medium text-white/70">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3.5 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-logo-blue/50 focus:ring-1 focus:ring-logo-blue/30 transition-all resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-white text-navy py-4 text-base font-semibold hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>

              {status === "sent" && (
                <p className="mt-4 text-center text-sm text-green-400">
                  Message sent successfully! We&apos;ll get back to you soon.
                </p>
              )}
              {status === "error" && (
                <p className="mt-4 text-center text-sm text-red-400">
                  Something went wrong. Please try again or email us directly.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
