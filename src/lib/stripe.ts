import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { PRICING, type BillingPlan } from '../config/premium';
import { supabase } from './supabase';

type CheckoutResult = {
  status: 'success' | 'cancel';
  sessionId: string | null;
};

type CheckoutPayload = {
  plan: BillingPlan;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  customerEmail?: string;
};

const BILLING_QUERY_KEY = 'checkout';
const SESSION_QUERY_KEY = 'session_id';

const openExternalUrl = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }

  window.location.assign(url);
};

const getWebReturnUrl = (status: CheckoutResult['status']) => {
  const url = new URL(window.location.href);
  url.searchParams.set(BILLING_QUERY_KEY, status);
  return url.toString();
};

const getNativeReturnUrl = (status: CheckoutResult['status']) =>
  `digiwell://billing-return?${BILLING_QUERY_KEY}=${status}`;

const getReturnUrl = (status: CheckoutResult['status']) =>
  Capacitor.isNativePlatform() ? getNativeReturnUrl(status) : getWebReturnUrl(status);

const getFallbackCheckoutUrl = (plan: BillingPlan) => PRICING[plan].checkoutUrl;

export const readCheckoutResult = (): CheckoutResult | null => {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const status = url.searchParams.get(BILLING_QUERY_KEY);

  if (status !== 'success' && status !== 'cancel') return null;

  return {
    status,
    sessionId: url.searchParams.get(SESSION_QUERY_KEY),
  };
};

export const clearCheckoutResult = () => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete(BILLING_QUERY_KEY);
  url.searchParams.delete(SESSION_QUERY_KEY);
  window.history.replaceState({}, document.title, url.toString());
};

export const startPremiumCheckout = async (plan: BillingPlan) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Vui lòng đăng nhập trước khi thanh toán Premium.');

  const payload: CheckoutPayload = {
    plan,
    userId: user.id,
    customerEmail: user.email,
    successUrl: getReturnUrl('success'),
    cancelUrl: getReturnUrl('cancel'),
  };

  const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    body: payload,
  });

  if (error) {
    const fallbackUrl = getFallbackCheckoutUrl(plan);

    if (!fallbackUrl) {
      throw new Error('Chưa cấu hình Stripe Checkout. Hãy thêm URL checkout hoặc deploy edge function Stripe.');
    }

    await openExternalUrl(fallbackUrl);
    return;
  }

  const checkoutData = data as { url?: string } | null;

  if (!checkoutData?.url) {
    throw new Error('Stripe không trả về URL thanh toán hợp lệ.');
  }

  await openExternalUrl(checkoutData.url);
};
