'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { LANGUAGE_OPTIONS } from '@/lib/i18n';
import type { User, Language } from '@/types';

export function SettingsClient({ user }: { user: User }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t, language, setLanguage } = useLanguageStore();
  const { setUser } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  const isPremium = ['premium', 'trial'].includes(user.subscription_status);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const res = await fetch('/api/user/delete', { method: 'POST' });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push('/');
    }
    setIsDeleting(false);
  };

  const handleExportData = async () => {
    const res = await fetch('/api/user/export-data');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-inburgering-data.json';
    a.click();
  };

  return (
    <div className="page-container">
      <TopBar title={t('settings.title')} showLanguageSelector={false} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Language */}
        <SettingsSection title={t('settings.language')}>
          <div className="space-y-2 pt-1">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code as Language)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border transition-all ${
                  language === opt.code ? 'border-brand-primary bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium text-gray-900">{opt.nativeLabel}</span>
                {language === opt.code && <span className="text-brand-primary">✓</span>}
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Subscription */}
        <SettingsSection title={t('settings.subscription')}>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">
                {isPremium ? t('settings.subscription.active') : t('settings.subscription.free')}
              </p>
              {user.subscription_expiry && (
                <p className="text-xs text-gray-400">
                  Expires: {new Date(user.subscription_expiry).toLocaleDateString()}
                </p>
              )}
            </div>
            {isPremium ? (
              <a href="/api/stripe/portal" className="text-sm text-brand-primary hover:underline font-medium">
                {t('settings.subscription.manage')}
              </a>
            ) : (
              <button onClick={() => router.push('/trial')}
                className="text-sm text-brand-primary hover:underline font-medium">
                {t('settings.subscription.upgrade')}
              </button>
            )}
          </div>
        </SettingsSection>

        {/* Privacy & Data (GDPR — PRD §22) */}
        <SettingsSection title={t('settings.privacy')}>
          <div className="space-y-1">
            <SettingsRow
              icon="📦"
              label={t('settings.export_data')}
              onClick={handleExportData}
            />
            <SettingsRow
              icon="🗑️"
              label={t('settings.delete_account')}
              onClick={() => setShowDeleteModal(true)}
              danger
            />
          </div>
        </SettingsSection>

        {/* App info */}
        <div className="card text-center space-y-1">
          <p className="text-xs text-gray-400">{t('settings.version')} {process.env.NEXT_PUBLIC_APP_VERSION}</p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-brand-primary hover:underline">Terms of Service</a>
          </div>
        </div>

        {/* Logout */}
        <Button onClick={handleLogout} isLoading={isLoggingOut} variant="secondary" fullWidth>
          {t('settings.logout')}
        </Button>
      </main>

      <BottomNav />

      {/* Delete account confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        showCloseButton
      >
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            This permanently deletes all your data within 72 hours as required by GDPR.
            This action cannot be undone.
          </p>
          <Button onClick={handleDeleteAccount} isLoading={isDeleting} variant="danger" fullWidth>
            Yes, delete my account
          </Button>
          <Button onClick={() => setShowDeleteModal(false)} variant="ghost" fullWidth>
            {t('general.cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-2">
      <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function SettingsRow({ icon, label, onClick, danger }: {
  icon: string; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-1 py-3 rounded-xl hover:bg-gray-50 transition-colors ${
        danger ? 'text-red-600' : 'text-gray-700'
      }`}
    >
      <span className="text-lg w-7 text-center">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
