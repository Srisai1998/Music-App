'use client';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsAPI } from '../../services/api';
import { useAppSelector } from '../../hooks/useRedux';
import { Crown, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    features: ['Ad-free listening', 'Unlimited downloads', 'High quality audio', 'Listen offline', 'Group Session'],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$89.99',
    period: '/year',
    badge: 'BEST VALUE',
    savings: 'Save 25%',
    features: ['Ad-free listening', 'Unlimited downloads', 'High quality audio', 'Listen offline', 'Group Session', 'Early access to features'],
  },
];

export default function PremiumPage() {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState<string | null>(null);

  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionsAPI.get().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const handleSubscribe = async (plan: string) => {
    if (!isAuthenticated) { toast.error('Please log in first'); return; }
    setLoading(plan);
    try {
      const { data } = await subscriptionsAPI.checkout(plan);
      window.location.href = data.data.url;
    } catch {
      toast.error('Failed to start checkout');
      setLoading(null);
    }
  };

  const isPremium = user?.subscription_type !== 'free';

  return (
    <div className="p-6">
      <div className="text-center mb-12">
        <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-3">
          {isPremium ? 'You have Premium' : 'Upgrade to Premium'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isPremium ? `Your ${user?.subscription_type} plan is active.` : 'Listen without limits. Cancel anytime.'}
        </p>
        {sub?.subscription_expires_at && (
          <p className="text-primary mt-2">
            Valid until {new Date(sub.subscription_expires_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {!isPremium && (
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border-2 ${plan.badge ? 'border-primary bg-primary/5' : 'border-secondary bg-secondary'}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
                {plan.savings && <span className="ml-2 text-primary text-sm font-bold">{plan.savings}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading}
                className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Get {plan.name}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
