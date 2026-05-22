'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/services/api';
import { BillingStatus } from '@/types/index';
import { getToken } from '@/lib/auth';

let cache: BillingStatus | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

export function useBilling() {
  const [billing, setBilling] = useState<BillingStatus | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (!getToken()) return;
    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_TTL) {
      setBilling(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    ApiClient.getBillingStatus()
      .then(b => {
        cache = b;
        cacheTimestamp = Date.now();
        setBilling(b);
      })
      .catch(() => setBilling(null))
      .finally(() => setLoading(false));
  }, []);

  function invalidate() {
    cache = null;
    cacheTimestamp = 0;
  }

  const plan = billing?.plan ?? 'free';
  const entitlements = billing?.entitlements;
  const usage = billing?.usage;

  return {
    billing,
    loading,
    plan,
    entitlements,
    usage,
    isPro: plan === 'pro' || plan === 'team',
    isTeam: plan === 'team',
    isFree: plan === 'free',
    invalidate,
  };
}
