"use client";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create mailto link with form data
    const mailtoLink = `mailto:contact@provigen.ai?subject=Inquiry from ${formData.email}&body=${encodeURIComponent(
      `From: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.location.href = mailtoLink;
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

            <div className="flex justify-center">
              <button
                type="submit"
                className="inline-block rounded-md bg-primary py-4 px-8 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
              >
                Send Message
              </button>
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
