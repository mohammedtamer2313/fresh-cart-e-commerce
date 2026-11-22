import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalInfoPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <nav className="mb-5 text-sm text-gray-500"><Link href="/" className="hover:text-primary-600">Home</Link><span className="mx-2">/</span><span>{title}</span></nav>
    <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs sm:p-10"><p className="text-xs font-semibold uppercase tracking-wider text-primary-600">FreshCart policies</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1><p className="mt-2 text-sm text-gray-500">Last updated {updated}</p><div className="mt-8 space-y-6 text-sm leading-7 text-gray-600">{children}</div></article>
  </main>;
}
