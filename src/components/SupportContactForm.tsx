"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function SupportContactForm() {
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 2200));
    toast.success(<span>Message sent successfully!<br />We&apos;ll get back to you as soon as possible.</span>, { duration: 5000 });
    formElement.reset();
    setSubject("");
    setIsSubmitting(false);
  }

  return <form onSubmit={submitMessage} className="space-y-5">
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div><label htmlFor="support-name" className="mb-2 block text-sm font-medium text-gray-700">Full Name</label><input id="support-name" name="name" required autoComplete="name" placeholder="Your name" className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20" /></div>
      <div><label htmlFor="support-email" className="mb-2 block text-sm font-medium text-gray-700">Email Address</label><input id="support-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20" /></div>
    </div>
    <div><label htmlFor="support-subject" className="mb-2 block text-sm font-medium text-gray-700">Subject</label><select id="support-subject" name="subject" required value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"><option value="">Select a subject</option><option>General Inquiry</option><option>Order Support</option><option>Shipping Question</option><option>Returns & Refunds</option><option>Product Information</option><option>Feedback & Suggestions</option><option>Other</option></select></div>
    <div><label htmlFor="support-message" className="mb-2 block text-sm font-medium text-gray-700">Message</label><textarea id="support-message" name="message" required rows={5} placeholder="How can we help you?" className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20" /></div>
    <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 font-semibold text-white shadow-xs shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-75 md:w-auto">{isSubmitting ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Sending...</> : <><Send size={16} aria-hidden="true" />Send Message</>}</button>
  </form>;
}
