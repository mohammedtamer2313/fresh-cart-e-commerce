import LegalInfoPage from "@/components/LegalInfoPage";

export default function CookiePolicyPage() {
  return <LegalInfoPage title="Cookie Policy" updated="November 2026">
    <section><h2 className="text-lg font-semibold text-gray-900">How cookies are used</h2><p>FreshCart uses browser storage and cookies to keep your shopping session, remember account preferences, and support essential store features.</p></section>
    <section><h2 className="text-lg font-semibold text-gray-900">Managing cookies</h2><p>You can remove or block cookies in your browser settings. Some account and shopping features may stop working if essential storage is disabled.</p></section>
    <section><h2 className="text-lg font-semibold text-gray-900">Questions</h2><p>For questions about this policy, email <a className="font-medium text-primary-600 hover:underline" href="mailto:mohammedtamer2313@gmail.com">mohammedtamer2313@gmail.com</a>.</p></section>
  </LegalInfoPage>;
}
