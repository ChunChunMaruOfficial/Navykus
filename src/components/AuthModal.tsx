import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Eye, EyeOff, LogOut, UserRound, X } from 'lucide-react';

import {
  getRememberedPlatformAccount,
  platformApi,
  rememberPlatformAccount,
  type PlatformUser,
  type RememberedPlatformAccount,
} from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange?: (user: PlatformUser | null) => void;
}

type AuthMode = 'login' | 'register';
type LoadState = 'idle' | 'loading' | 'success' | 'error';

const AUTH_FIELD_CLASS =
  'w-full rounded-xl border border-[#d8d1cc] bg-white/70 px-3 py-2 text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-slate/40 focus:border-brand-dark/45 focus:bg-white sm:px-4 sm:py-2.5 sm:text-sm';

const rememberedDisplayName = (account: RememberedPlatformAccount) => (
  [account.firstName, account.lastName].filter(Boolean).join(' ') || account.name || account.email
);

function PasswordField({
  label,
  value,
  show,
  toggleLabel,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  toggleLabel: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 sm:text-xs">
      {label}
      <div className="relative mt-1">
        <input
          type={show ? 'text' : 'password'}
          required
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${AUTH_FIELD_CLASS} pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-slate/60 transition-colors hover:bg-white/60 hover:text-brand-dark cursor-pointer"
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={show ? 'eye-off' : 'eye'}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    </label>
  );
}

export default function AuthModal({ isOpen, onClose, onAuthChange }: AuthModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onAuthChangeRef = useRef(onAuthChange);
  onAuthChangeRef.current = onAuthChange;
  const [mode, setMode] = useState<AuthMode>('login');
  const [isCodeLogin, setIsCodeLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<PlatformUser | null | undefined>(undefined);
  const [rememberedAccount, setRememberedAccount] = useState<RememberedPlatformAccount | undefined>(undefined);
  const [state, setState] = useState<LoadState>('idle');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    privacyAccepted: true,
    termsAccepted: true,
  });

  const openProfile = () => {
    window.history.pushState({}, '', '/profile');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    setRememberedAccount(getRememberedPlatformAccount());
    platformApi.me().then((result) => {
      setUser(result.user);
      onAuthChangeRef.current?.(result.user);
      openProfile();
    }).catch(() => {
      setUser(null);
      onAuthChangeRef.current?.(null);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'));

      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const quickLogin = async () => {
    if (!rememberedAccount?.token) {
      // No stored token, fall back to filling in the email
      useRememberedAccount();
      return;
    }
    setState('loading');
    setMessage('');
    try {
      const result = await platformApi.quickLogin(rememberedAccount.token);
      setUser(result.user);
      rememberPlatformAccount(result.user, rememberedAccount.token);
      setRememberedAccount(getRememberedPlatformAccount());
      onAuthChangeRef.current?.(result.user);
      setState('idle');
      openProfile();
    } catch {
      // Token expired, fall back to password login
      useRememberedAccount();
    }
  };

  const useRememberedAccount = () => {
    if (!rememberedAccount) return;
    setMode('login');
    setMessage('');
    setForm((current) => ({
      ...current,
      email: rememberedAccount.email,
      password: '',
      passwordConfirmation: '',
    }));
    window.setTimeout(() => {
      modalRef.current?.querySelector<HTMLInputElement>('input[type="password"]')?.focus();
    }, 0);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState('loading');
    setMessage('');

    if (mode === 'login' && isCodeLogin) {
      setState('idle');
      setMessage(t('ui.authmodal.codeComingSoon'));
      return;
    }

    try {
      const result = mode === 'login'
        ? await platformApi.login({ email: form.email, password: form.password })
        : await platformApi.register(form);

      setUser(result.user);
      rememberPlatformAccount(result.user, result.token);
      setRememberedAccount(getRememberedPlatformAccount());
      onAuthChangeRef.current?.(result.user);
      setState('idle');
      setMessage('');
      openProfile();
    } catch (error) {
      setState('error');
      setMessage(t(`platform.errors.${(error as Error).name}`, { defaultValue: t('platform.errors.API_ERROR') }));
    }
  };

  const logout = async () => {
    setState('loading');
    await platformApi.logout().catch(() => undefined);
    setUser(null);
    onAuthChangeRef.current?.(null);
    setState('idle');
    setMessage('');
  };

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md"
          />

          <motion.div
            layout
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, type: 'spring', damping: 25, stiffness: 220 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative z-10 max-h-[calc(100vh-2rem)] w-[96%] max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white/35 shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.45),0_40px_120px_rgba(27,24,22,0.12)] backdrop-blur-3xl sm:w-full"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full p-2 text-brand-dark transition-colors duration-200 hover:bg-brand-bg-3/50 sm:right-5 sm:top-5"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div layout className="p-4 sm:p-6 lg:p-7">
              {user ? (
                <motion.div layout className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 id="auth-modal-title" className="font-serif text-xl tracking-tight text-brand-dark sm:text-2xl">
                        {t('ui.authmodal.authorizedTitle')}
                      </h2>
                      <p className="mt-1 text-sm font-light text-brand-slate">
                        {t('ui.authmodal.authorizedText', { name: displayName })}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/60 bg-white/20 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark text-white">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-brand-dark">{displayName}</div>
                        <div className="truncate text-xs text-brand-slate">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, '', '/profile');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                        onClose();
                      }}
                      className="flex-1 rounded-xl bg-brand-dark py-3 text-center text-xs font-medium text-white transition-all duration-200 hover:bg-brand-dark/95"
                    >
                      {t('ui.authmodal.profile')}
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      disabled={state === 'loading'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-pink-dust/30 bg-brand-bg-2 py-3 text-xs font-medium text-brand-dark transition-all duration-200 hover:bg-brand-bg-3 disabled:opacity-70"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('platform.actions.logout')}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form layout onSubmit={submit} className="space-y-4">
                  <div>
                    <h2 id="auth-modal-title" className="font-serif text-3xl tracking-tight text-brand-dark sm:text-4xl">
                      {mode === 'register' ? t('platform.auth.registerTitle') : isCodeLogin ? t('ui.authmodal.codeTitle') : t('platform.auth.loginTitle')}
                    </h2>
                    <p className="mt-1 text-xs font-light text-brand-slate sm:text-sm">
                      {mode === 'register' ? t('ui.authmodal.subtitle') : isCodeLogin ? t('ui.authmodal.codeSubtitle') : t('ui.authmodal.subtitle')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 rounded-2xl border border-white/60 bg-white/20 p-1 text-xs font-semibold text-brand-slate">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setMessage('');
                      }}
                      className={`rounded-xl px-3 py-2 transition-colors ${mode === 'login' ? 'bg-brand-dark text-white' : 'hover:bg-white/40'}`}
                    >
                      {t('platform.auth.loginTitle')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setMessage('');
                      }}
                      className={`rounded-xl px-3 py-2 transition-colors ${mode === 'register' ? 'bg-brand-dark text-white' : 'hover:bg-white/40'}`}
                    >
                      {t('platform.auth.registerTitle')}
                    </button>
                  </div>

                  {mode === 'login' && rememberedAccount && (
                    <button
                      type="button"
                      onClick={quickLogin}
                      className="flex w-full items-center gap-3 rounded-2xl border border-brand-pink-dust/30 bg-white/35 p-3 text-left transition-colors hover:bg-white/55"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-brand-dark">{t('platform.auth.quickLoginTitle')}</span>
                        <span className="block truncate text-sm text-brand-slate">
                          {t('platform.auth.quickLoginHint', { name: rememberedDisplayName(rememberedAccount) })}
                        </span>
                      </span>
                      <span className="rounded-xl bg-brand-bg-2 px-3 py-2 text-xs font-semibold text-brand-dark">
                        {t('platform.auth.quickLoginAction')}
                      </span>
                    </button>
                  )}



                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode + (isCodeLogin ? '-code' : '-pwd')}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {mode === 'register' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 sm:text-xs">
                            {t('platform.fields.firstName')}
                            <input value={form.firstName} onChange={(event) => update('firstName', event.target.value)} className={`${AUTH_FIELD_CLASS} mt-1`} />
                          </label>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 sm:text-xs">
                            {t('platform.fields.lastName')}
                            <input value={form.lastName} onChange={(event) => update('lastName', event.target.value)} className={`${AUTH_FIELD_CLASS} mt-1`} />
                          </label>
                        </div>
                      )}

                      <label className="block text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 sm:text-xs">
                        {t('platform.fields.email')}
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(event) => update('email', event.target.value)}
                          placeholder="name@example.com"
                          className={`${AUTH_FIELD_CLASS} mt-1`}
                        />
                      </label>

                      {mode === 'login' && isCodeLogin ? (
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <label className="block min-w-0 text-[10px] font-mono uppercase tracking-wider text-brand-dark/70 sm:text-xs">
                            {t('ui.authmodal.codeInput')}
                            <input
                              inputMode="numeric"
                              value=""
                              disabled
                              placeholder="000000"
                              className={`${AUTH_FIELD_CLASS} mt-1 tracking-[0.35em] disabled:cursor-not-allowed disabled:opacity-60`}
                            />
                          </label>
                          <button
                            type="button"
                            disabled
                            className="mt-5 rounded-xl border border-brand-pink-dust/30 bg-brand-bg-2 px-4 text-xs font-semibold text-brand-slate disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('ui.authmodal.sendCode')}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          <PasswordField
                            label={t('platform.fields.password')}
                            value={form.password}
                            show={showPassword}
                            onToggle={() => setShowPassword((current) => !current)}
                            onChange={(value) => update('password', value)}
                            toggleLabel={showPassword ? t('ui.authmodal.hidePassword') : t('ui.authmodal.showPassword')}
                          />
                          {mode === 'register' && (
                            <PasswordField
                              label={t('platform.fields.passwordConfirmation')}
                              value={form.passwordConfirmation}
                              show={showPassword}
                              onToggle={() => setShowPassword((current) => !current)}
                              onChange={(value) => update('passwordConfirmation', value)}
                              toggleLabel={showPassword ? t('ui.authmodal.hidePassword') : t('ui.authmodal.showPassword')}
                            />
                          )}
                        </div>
                      )}

                      {mode === 'register' && (
                        <div className="space-y-2 rounded-2xl border border-white/60 bg-white/20 p-3 text-xs text-brand-slate">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={form.privacyAccepted} onChange={(event) => update('privacyAccepted', event.target.checked)} className="h-4 w-4 accent-[#bc4638]" />
                            <span>{t('platform.auth.privacyAccepted')}</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={form.termsAccepted} onChange={(event) => update('termsAccepted', event.target.checked)} className="h-4 w-4 accent-[#bc4638]" />
                            <span>{t('platform.auth.termsAccepted')}</span>
                          </label>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {message && (
                    <div className={`rounded-xl px-4 py-3 text-sm ${state === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {message}
                    </div>
                  )}

                  <div className={`grid gap-3 ${mode === 'login' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCodeLogin((current) => !current);
                          setMessage('');
                        }}
                        className="rounded-xl border border-[#d8d1cc] bg-white/40 px-4 py-3 text-xs font-semibold text-brand-slate transition-all hover:bg-white/60 hover:text-brand-dark"
                      >
                        {isCodeLogin ? t('platform.fields.password') : t('ui.authmodal.codeTab')}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={state === 'loading'}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand-terracotta px-6 py-3 text-sm font-medium text-white shadow-lg shadow-brand-terracotta/20 transition-all duration-300 hover:bg-brand-terracotta/95 hover:shadow-brand-terracotta/35 disabled:opacity-75"
                    >
                      {state === 'loading' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                      <span>{mode === 'register' ? t('platform.auth.registerAction') : isCodeLogin ? t('ui.authmodal.codeAction') : t('platform.auth.loginAction')}</span>
                    </button>
                  </div>
                </motion.form>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
