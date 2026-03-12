export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center gap-6">
      <div className="w-20 h-20 bg-gray-200 rounded-3xl flex items-center justify-center">
        <span className="text-4xl">📡</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">No Internet Connection</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          Your exam progress has been saved. Reconnect to continue.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary max-w-xs"
      >
        Try again
      </button>
    </main>
  );
}
