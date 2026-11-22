import Link from "next/link";
import { ArrowLeft, Clock3, Cookie, Database, LockKeyhole, Mail, Share2, ShieldCheck, UserRoundCheck, UserRoundShield } from "lucide-react";

const articles = [
  {
    title: "Information We Collect", icon: Database, items: [
      ["Personal information", "Name, email address, phone number, and delivery address you provide."],
      ["Account and order information", "Account details, purchases, and the information needed to fulfill your orders."],
      ["Payment information", "Payment details are submitted to the payment provider used for checkout."],
      ["Technical information", "Basic device, browser, and usage information generated when you use the store."],
    ],
  },
  {
    title: "How We Use Your Information", icon: UserRoundShield, items: [
      ["Fulfill orders", "Process purchases and coordinate delivery."],
      ["Support your account", "Respond to questions and help manage your account and orders."],
      ["Improve the store", "Understand how the store is used and improve its products and experience."],
      ["Store communications", "Send service messages about your account or purchases."],
    ],
  },
  {
    title: "Data Protection", icon: LockKeyhole, items: [
      ["Access controls", "We limit access to personal information to people who need it to operate the store."],
      ["Service providers", "We use appropriate providers to support store operations, including payment and delivery."],
      ["Secure handling", "We take reasonable steps to protect information, though no online service can guarantee absolute security."],
    ],
  },
  {
    title: "Information Sharing", icon: Share2, items: [
      ["Service providers", "Information may be shared with providers who help process payments, deliver orders, or run the store."],
      ["Legal requirements", "We may disclose information when required by law or to protect the store and its customers."],
      ["No sale of personal data", "We do not sell your personal information."],
    ],
  },
  {
    title: "Your Choices", icon: UserRoundCheck, items: [
      ["Review your details", "You can review account information on your My Account page."],
      ["Request a change or deletion", "Contact us to ask about correcting or deleting your personal information."],
      ["Marketing messages", "You may opt out of promotional messages by contacting us."],
    ],
  },
  {
    title: "Cookies", icon: Cookie, items: [
      ["Essential storage", "Cookies and browser storage help keep account and shopping features working."],
      ["Browser settings", "You can manage cookies through your browser. Blocking them may affect some store features."],
    ],
  },
];

export default function PrivacyPage() {
  return <main className="min-h-screen bg-linear-to-b from-gray-50 to-white">
    <header className="bg-linear-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-white/70"><Link href="/" className="transition-colors duration-200 hover:text-white">Home</Link><span className="text-white/40">/</span><span className="font-medium text-white">Privacy Policy</span></nav>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"><div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-2xl shadow-primary-900/30 ring-1 ring-white/30 backdrop-blur-sm"><ShieldCheck size={40} aria-hidden="true" /></div><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Privacy Policy</h1><p className="mt-2 text-lg text-white/80">Last updated: February 2026</p></div></div>
      </div>
    </header>

    <div className="container mx-auto px-4 py-12">
      <section className="mb-12 rounded-3xl border border-primary-200 bg-linear-to-r from-primary-50 to-primary-100/50 p-6 shadow-xs sm:p-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/25"><ShieldCheck size={24} aria-hidden="true" /></div><div><h2 className="mb-2 text-lg font-bold text-primary-900">Your Privacy Matters</h2><p className="leading-relaxed text-primary-800">This Privacy Policy describes how FreshCart collects, uses, and protects your personal information when you use our services. We are committed to treating your information responsibly.</p></div></div></section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {articles.map(({ title, icon: Icon, items }, articleIndex) => <section key={title} className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:border-primary-100 hover:shadow-lg sm:p-8">
          <div className="mb-5 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary-100 to-primary-50 text-primary-600 transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-400 group-hover:text-white"><Icon size={22} aria-hidden="true" /></div><div><span className="text-xs font-bold uppercase tracking-wider text-primary-600">Article {articleIndex + 1}</span><h2 className="text-xl font-bold text-gray-900">{title}</h2></div></div>
          <div className="space-y-3">{items.map(([label, description], itemIndex) => <div key={label} className="flex items-start gap-3 leading-relaxed text-gray-600"><span className="mt-0.5 shrink-0 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-500">{articleIndex + 1}.{itemIndex + 1}</span><p className="text-sm"><strong className="text-gray-800">{label}: </strong>{description}</p></div>)}</div>
        </section>)}

        <section className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:border-primary-100 hover:shadow-lg sm:p-8"><div className="mb-5 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary-100 to-primary-50 text-primary-600 transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-400 group-hover:text-white"><Clock3 size={22} aria-hidden="true" /></div><div><span className="text-xs font-bold uppercase tracking-wider text-primary-600">Article 7</span><h2 className="text-xl font-bold text-gray-900">Data Retention</h2></div></div><p className="text-sm leading-relaxed text-gray-600">We keep personal information for as long as needed to support your account, fulfill purchases, and meet applicable legal requirements. Contact us if you have a request about your information.</p></section>
        <section className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:border-primary-100 hover:shadow-lg sm:p-8"><div className="mb-5 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary-100 to-primary-50 text-primary-600 transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-400 group-hover:text-white"><Mail size={22} aria-hidden="true" /></div><div><span className="text-xs font-bold uppercase tracking-wider text-primary-600">Article 8</span><h2 className="text-xl font-bold text-gray-900">Contact Us</h2></div></div><p className="text-sm leading-relaxed text-gray-600">For questions about this policy or to make a privacy request, email <a href="mailto:mohammedtamer2313@gmail.com" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">mohammedtamer2313@gmail.com</a>.</p></section>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-8"><div className="flex flex-col items-center justify-between gap-4 sm:flex-row"><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200"><ArrowLeft size={16} aria-hidden="true" />Back to Home</Link><Link href="/terms" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:bg-primary-600">View Terms of Service<span className="text-lg">→</span></Link></div></div>
    </div>
  </main>;
}
