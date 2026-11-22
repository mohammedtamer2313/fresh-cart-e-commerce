import Link from "next/link";
import { ArrowRight, Clock3, Headset, HelpCircle, Mail, MapPin, Phone } from "lucide-react";
import SupportContactForm from "@/components/SupportContactForm";

const contact = {
  phone: "+201015815442",
  email: "mohammedtamer2313@gmail.com",
};

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { label: "Twitter", href: "https://x.com/", icon: "twitter" },
  { label: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "linkedin" },
];

function SocialIcon({ name }: { name: string }) {
  const common = { className: "h-[18px] w-[18px]", fill: "currentColor", "aria-hidden": true as const };
  if (name === "facebook") return <svg {...common} viewBox="0 0 320 512"><path d="M80 299.3V512h116V299.3h86.5l18-97.8H196v-34.6c0-51.7 20.3-71.5 72.7-71.5 16.3 0 29.4.4 37 1.2V7.9C291.4 4 256.4 0 236.2 0 129.3 0 80 50.5 80 159.4v42.1H14v97.8h66z" /></svg>;
  if (name === "twitter") return <svg {...common} viewBox="0 0 512 512"><path d="M459.4 151.7c.3 4.5.3 9.1.3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103v-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z" /></svg>;
  if (name === "instagram") return <svg {...common} viewBox="0 0 448 512"><path d="M224.3 141a115 115 0 1 0-.6 230 115 115 0 1 0 .6-230zm-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1-.6-149.2zm93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1-53.6 0zm129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" /></svg>;
  return <svg {...common} viewBox="0 0 448 512"><path d="M100.3 448H7.4V148.9h92.9V448zM53.8 108.1C24.1 108.1 0 83.5 0 53.8 0 39.5 5.7 25.9 15.8 15.8S39.6 0 53.8 0s27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z" /></svg>;
}

export default function SupportPage() {
  return <main className="min-h-screen bg-gray-50/50">
    <header className="bg-linear-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/70"><Link href="/" className="transition-colors hover:text-white">Home</Link><span className="text-white/40">/</span><span className="font-medium text-white">Contact Us</span></nav>
        <div className="flex items-center gap-5"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-xl ring-1 ring-white/30 backdrop-blur-sm"><Headset size={32} aria-hidden="true" /></div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1><p className="mt-1 text-white/80">We&apos;d love to hear from you. Get in touch with our team.</p></div></div>
      </div>
    </header>

    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <aside id="contact" className="scroll-mt-24 space-y-6 lg:col-span-1">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Phone size={20} aria-hidden="true" /></div><div><h2 className="mb-1 font-semibold text-gray-900">Phone</h2><p className="mb-2 text-sm text-gray-500">Mon-Fri from 8am to 6pm</p><a href={`tel:${contact.phone}`} className="font-medium text-primary-600 hover:underline">{contact.phone}</a></div></div></section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Mail size={20} aria-hidden="true" /></div><div><h2 className="mb-1 font-semibold text-gray-900">Email</h2><p className="mb-2 text-sm text-gray-500">We&apos;ll respond within 24 hours</p><a href={`mailto:${contact.email}`} className="break-all font-medium text-primary-600 hover:underline">{contact.email}</a></div></div></section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><MapPin size={20} aria-hidden="true" /></div><div><h2 className="mb-1 font-semibold text-gray-900">Office</h2><p className="text-sm leading-5 text-gray-500">123 Commerce Street<br />New York, NY 10001<br />United States</p></div></div></section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Clock3 size={20} aria-hidden="true" /></div><div><h2 className="mb-1 font-semibold text-gray-900">Business Hours</h2><p className="text-sm leading-5 text-gray-500">Monday - Friday: 8am - 6pm<br />Saturday: 9am - 4pm<br />Sunday: Closed</p></div></div></section>
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs"><h2 className="mb-4 font-semibold text-gray-900">Follow Us</h2><div className="flex items-center gap-3">{socialLinks.map(({ label, href, icon }) => <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-primary-600 hover:text-white"><SocialIcon name={icon} /></a>)}</div></section>
        </aside>

        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:p-8"><div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Headset size={20} aria-hidden="true" /></div><div><h2 className="text-xl font-bold text-gray-900">Send us a Message</h2><p className="text-sm text-gray-500">Fill out the form and we&apos;ll get back to you</p></div></div><SupportContactForm /></section>
          <section id="help" className="mt-6 scroll-mt-24 rounded-2xl border border-primary-100 bg-primary-50 p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-xs"><HelpCircle size={23} aria-hidden="true" /></div><div><h2 className="mb-1 font-semibold text-gray-900">Looking for quick answers?</h2><p className="mb-3 text-sm text-gray-600">Check out our Help Center for frequently asked questions about orders, shipping, returns, and more.</p><Link href="/support#help" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">Visit Help Center <ArrowRight size={14} aria-hidden="true" /></Link></div></div></section>
        </div>
      </div>
    </div>
  </main>;
}
