'use client';

import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLanguageStore } from '@/store/useLanguageStore';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: string; // what triggered it
}

// PRD §9.3 — Zero dark patterns. Close ALWAYS visible.
export function PaywallModal({ isOpen, onClose, trigger }: PaywallModalProps) {
  const { t } = useLanguageStore();
  const router = useRouter();

  const benefits = [
    { icon: '📝', label: t('paywall.benefit1') },
    { icon: '🤖', label: t('paywall.benefit2') },
    { icon: '📊', label: t('paywall.benefit3') },
  ];

  const handleUpgrade = () => {
    onClose();
    router.push('/trial');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true} // Always visible — PRD §9.3
    >
      <div className="text-center space-y-5 pb-2">
        {/* Icon */}
        <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-3xl">⭐</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900">{t('paywall.title')}</h2>

        {/* 3 benefit items (PRD §9.3) */}
        <ul className="space-y-3 text-start">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="text-xl w-8 text-center">{b.icon}</span>
              <span className="text-gray-700 font-medium">{b.label}</span>
            </li>
          ))}
        </ul>

        {/* Price */}
        <p className="text-2xl font-bold text-brand-primary">{t('paywall.price')}</p>

        {/* CTA */}
        <Button onClick={handleUpgrade} fullWidth>
          {t('paywall.trial')}
        </Button>

        {/* "Maybe later" text link (PRD §9.3) */}
        <button
          onClick={onClose}
          className="text-gray-400 text-sm hover:text-gray-600 w-full"
        >
          {t('paywall.later')}
        </button>
      </div>
    </Modal>
  );
}
