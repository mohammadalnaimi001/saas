import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase, APP } from "../lib/supabase";
import { BrandMark, Spinner } from "../components/ui";
import PunchCard from "../components/PunchCard";
import type { CardData } from "../lib/types";

export default function LoyaltyCard() {
  const { token } = useParams<{ token: string }>();
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_card", { p_token: token });
      if (error || !data) {
        setError(true);
      } else {
        setCard(data as CardData);
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Spinner label="Loading your card…" />
      </div>
    );

  if (error || !card)
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Card not found</h1>
          <p className="mt-2 text-sm text-muted">
            This link may be wrong or expired. Ask the shop for a fresh one.
          </p>
        </div>
      </div>
    );

  const ready = card.current_progress >= card.threshold;
  const accent = card.brand_color || "#473C6B";

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm">
        <div
          className="overflow-hidden rounded-xl2 shadow-lift"
          style={{ background: accent }}
        >
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Loyalty card
              </span>
              <BrandMark size={22} />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold">
              {card.business_name}
            </h1>
            <p className="mt-1 text-sm opacity-90">{card.customer_name}</p>
          </div>

          <div className="bg-white p-6">
            <PunchCard
              filled={card.current_progress}
              threshold={card.threshold}
              size="md"
            />
            <div
              className={`mt-5 rounded-xl p-4 text-center text-sm font-semibold ${
                ready ? "bg-reward/15 text-reward-deep" : "bg-brand-50 text-brand-700"
              }`}
            >
              {ready ? (
                <>🎉 You've earned: {card.reward_description}. Show this at the counter.</>
              ) : (
                <>
                  {card.threshold - card.current_progress} more to unlock:{" "}
                  {card.reward_description}
                </>
              )}
            </div>
            {card.rewards_earned > 0 && (
              <p className="mt-3 text-center text-xs text-muted">
                You've redeemed {card.rewards_earned}{" "}
                {card.rewards_earned === 1 ? "reward" : "rewards"} so far. Nice.
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Powered by {APP.name}
        </p>
      </div>
    </div>
  );
}
