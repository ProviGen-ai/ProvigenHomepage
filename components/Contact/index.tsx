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
    <div className="container pt-20 pb-20" id="contact">
      <div className="py-2 items-center">
        <div className="w-1/2 border-t-[1.5px] text-blue items-center mx-auto"></div>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold !leading-tight text-black sm:text-4xl md:text-[45px] mb-4">
            Contact Us
          </h2>
          <p className="text-base !leading-relaxed text-body-color-dark md:text-lg mb-8">
            Ready to accelerate your research? Get in touch with our team!
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg sm:p-12 mb-8">
          <form onSubmit={handleSubmit}>
            {/* Honeypot field - hidden from real users */}
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
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-black">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="name@example.com"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block mb-2 text-sm font-medium text-black">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Tell us about your project or inquiry..."
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-block rounded-md bg-primary py-4 px-8 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80 disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
              {status === "sent" && (
                <p className="text-green-600 font-medium">Message sent successfully!</p>
              )}
              {status === "error" && (
                <p className="text-red-600 font-medium">Failed to send. Please try again.</p>
              )}
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-body-color-dark mb-2">Or reach us directly at:</p>
            <a href="mailto:contact@provigen.ai" className="text-lg text-primary hover:underline font-semibold">
              contact@provigen.ai
            </a>
          </div>
        </div>

        <div className="text-center text-sm text-body-color-dark">
          <p>We typically respond within 24 hours during business days.</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
