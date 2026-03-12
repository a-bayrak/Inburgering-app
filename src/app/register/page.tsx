'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Capacitor } from '@capacitor/core';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguageStore();
  const router = useRouter();
  const supabase = createClient();

  const handleGoogle = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleApple = async () => {
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/gdpr');
    }
    setIsLoading(false);
  };

  // Detect iOS platform for Apple Sign-In (PRD §1.E.3 — PLATFORM-SPECIFIC)
  const isIOS = Capacitor.getPlatform() === 'ios' ||
    (typeof navigator !== 'undefined' && /iPad|iPhone/.test(navigator.userAgent));

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col p-6">
      <button onClick={() => router.back()} className="text-gray-400 py-2 self-start">
        ← {t('general.back')}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">NL</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboarding.register.title')}</h1>
        </div>

        {!showEmail ? (
          <div className="space-y-3">
            {/* Primary: Google (PRD §1.E.3) */}
            <Button onClick={handleGoogle} isLoading={isLoading} fullWidth variant="secondary">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06
