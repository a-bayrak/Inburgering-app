export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-8 max-w-2xl mx-auto">
      <a href="/settings" className="text-brand-primary text-sm mb-6 block">← Back</a>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-sm text-gray-700 space-y-4">
        <p><strong>Data Controller:</strong> Inburgering App BV, Rotterdam, Netherlands</p>
        <p><strong>Contact:</strong> privacy@inburgering.app</p>
        <h2 className="text-lg font-semibold mt-4">What data we collect</h2>
        <ul className="list-disc ps-5 space-y-1">
          <li>Email address and display name (account registration)</li>
          <li>Exam answers and results (to show your progress)</li>
          <li>Study statistics (streak, completion counts)</li>
          <li>Device information (push notifications, device limit)</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">Legal basis (GDPR)</h2>
        <ul className="list-disc ps-5 space-y-1">
          <li>Contract performance (Art. 6(1)(b)) — account data</li>
          <li>Consent (Art. 6(1)(a)) — AI features, analytics</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">Your rights</h2>
        <ul className="list-disc ps-5 space-y-1">
          <li>Access your data (Settings → Export my data)</li>
          <li>Delete your account (Settings → Delete account)</li>
          <li>Withdraw consent at any time (Settings → Privacy)</li>
        </ul>
        <h2 className="text-lg font-semibold mt-4">Data retention</h2>
        <p>Account data deleted within 72 hours of deletion request. Exam data anonymised after 2 years of inactivity.</p>
        <h2 className="text-lg font-semibold mt-4">Data location</h2>
        <p>All data stored on servers in the EU (Frankfurt, Germany) via Supabase.</p>
        <p className="text-xs text-gray-400 mt-8">Last updated: March 2026</p>
      </div>
    </main>
  );
}
