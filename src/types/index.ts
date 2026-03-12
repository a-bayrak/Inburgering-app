export * from './database';

export interface AppState {
  language: import('./database').Language;
  isRTL: boolean;
}

export type Platform = 'ios' | 'android' | 'web';

export interface OnboardingState {
  step: 'language' | 'welcome' | 'register' | 'gdpr' | 'trial' | 'home';
  selectedLanguage: import('./database').Language | null;
  gdprConsents: {
    account_data: boolean;
    ai_features: boolean;
    analytics: boolean;
  };
  trialSkipped: boolean;
}

export interface PaywallTrigger {
  reason: 'second_exam' | 'second_section' | 'ai_feature' | 'analytics';
  feature?: string;
}
