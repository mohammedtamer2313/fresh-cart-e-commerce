import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Handshake,
  IdCard,
  Mail,
  RotateCcw,
  Scale,
  Truck,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TermsArticle {
  number: number;
  title: string;
  icon: LucideIcon;
  points?: string[];
  paragraph?: string;
  contact?: boolean;
}

const articles: TermsArticle[] = [
  {
    number: 1,
    title: "Acceptance of Terms",
    icon: Handshake,
    points: [
      "By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.",
      "If you do not agree to these Terms, you must not access or use the Service.",
      "We reserve the right to modify these Terms at any time, and such modifications shall be effective immediately upon posting.",
    ],
  },
  {
    number: 2,
    title: "User Eligibility",
    icon: UserCheck,
    points: [
      "The Service is intended for users who are at least eighteen (18) years of age.",
      "By using the Service, you represent and warrant that you are of legal age to form a binding contract.",
      "If you are accessing the Service on behalf of a legal entity, you represent that you have the authority to bind such entity.",
    ],
  },
  {
    number: 3,
    title: "Account Registration",
    icon: IdCard,
    points: [
      "You may be required to create an account to access certain features of the Service.",
      "You agree to provide accurate, current, and complete information during registration.",
      "You are solely responsible for maintaining the confidentiality of your account credentials.",
      "You agree to notify us immediately of any unauthorized use of your account.",
    ],
  },
  {
    number: 4,
    title: "Orders and Payments",
    icon: CreditCard,
    points: [
      "All orders placed through the Service are subject to acceptance and availability.",
      "Prices are subject to change without notice prior to order confirmation.",
      "Payment must be made in full at the time of purchase through approved payment methods.",
      "We reserve the right to refuse or cancel any order at our sole discretion.",
    ],
  },
  {
    number: 5,
    title: "Shipping and Delivery",
    icon: Truck,
    points: [
      "Shipping times are estimates only and are not guaranteed.",
      "Risk of loss and title for items purchased pass to you upon delivery to the carrier.",
      "We are not responsible for delays caused by carriers, customs, or other factors beyond our control.",
    ],
  },
  {
    number: 6,
    title: "Returns and Refunds",
    icon: RotateCcw,
    points: [
      "Our return policy allows returns within 14 days of delivery for most items.",
      "Products must be unused and in original packaging.",
      "Refunds will be processed within 5-7 business days after receiving the returned item.",
    ],
  },
  {
    number: 7,
    title: "Limitation of Liability",
    icon: Scale,
    paragraph: "To the maximum extent permitted by applicable law, FreshCart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.",
  },
  {
    number: 8,
    title: "Contact Us",
    icon: Mail,
    contact: true,
  },
];

function TermsCard({ article }: { article: TermsArticle }) {
  const Icon = article.icon;

  return (
    <section className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:border-primary-100 hover:shadow-lg sm:p-8">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-400">
          <Icon size={21} className="text-primary-600 transition-colors duration-300 group-hover:text-white" aria-hidden="true" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Article {article.number}</span>
          <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
        </div>
      </div>

      {article.points ? (
        <div className="space-y-3">
          {article.points.map((point, index) => (
            <div key={`${article.number}.${index + 1}`} className="flex items-start gap-3 leading-relaxed text-gray-600">
              <span className="mt-0.5 shrink-0 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-500">{article.number}.{index + 1}</span>
              <p className="text-sm">{point}</p>
            </div>
          ))}
        </div>
      ) : article.contact ? (
        <p className="text-sm leading-relaxed text-gray-600">
          If you have any questions about these Terms, please contact us at{" "}
          <a href="mailto:mohammedtamer2313@gmail.com" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">mohammedtamer2313@gmail.com</a>
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-gray-600">{article.paragraph}</p>
      )}
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="transition-colors duration-200 hover:text-white">Home</Link>
            <span className="text-white/40" aria-hidden="true">/</span>
            <span aria-current="page" className="font-medium text-white">Terms of Service</span>
          </nav>
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-2xl shadow-primary-900/30 ring-1 ring-white/30 backdrop-blur-sm">
              <FileText size={38} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Terms of Service</h1>
              <p className="mt-2 text-lg text-white/80">Last updated: February 2026</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <aside className="mb-12 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-6 shadow-xs sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="mb-2 text-lg font-bold text-amber-900">Important Notice</h2>
              <p className="leading-relaxed text-amber-800">By accessing and using FreshCart, you accept and agree to be bound by the terms and provisions of this agreement. Please read these terms carefully before using our services.</p>
            </div>
          </div>
        </aside>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {articles.map((article) => <TermsCard key={article.number} article={article} />)}
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200">
              <ArrowLeft size={16} aria-hidden="true" />Back to Home
            </Link>
            <Link href="/privacy" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:bg-primary-600">
              View Privacy Policy<span className="text-lg" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
