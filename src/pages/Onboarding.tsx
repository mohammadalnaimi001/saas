import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "../components/ui";
import PunchCard from "../components/PunchCard";

export default function Onboarding() {
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(8);
  const [reward, setReward] = useState("A free item on the house");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function create() {
    setErr(null);
    if (!name.trim()) {
      setErr("Give your shop a name.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("create_business", {
      p_name: name.trim(),
      p_threshold: threshold,
      p_reward: reward.trim() || "A free reward",
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    await refresh();
    navigate("/app");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-xl font-bold">Set up your shop</span>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold">
            Your loyalty program
          </h1>
          <p className="mt-1 text-sm text-muted">
            This is what your customers earn toward. You can change it anytime.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="label" htmlFor="shop">
                Shop name
              </label>
              <input
                id="shop"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Habba Roastery"
              />
            </div>

            <div>
              <label className="label" htmlFor="threshold">
                Stamps needed for a reward
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="threshold"
                  type="range"
                  min={2}
                  max={20}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="w-10 text-right font-display text-xl font-bold tnum">
                  {threshold}
                </span>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="reward">
                The reward
              </label>
              <input
                id="reward"
                className="field"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="A free coffee"
              />
            </div>

            <div>
              <div className="label">Preview</div>
              <PunchCard filled={3} threshold={threshold} />
            </div>

            {err && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </p>
            )}

            <button onClick={create} disabled={busy} className="btn-primary w-full">
              {busy ? "Creating…" : "Launch my program"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
