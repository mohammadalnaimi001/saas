import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui";
import PunchCard from "../components/PunchCard";

const COLORS = ["#473C6B", "#1E1B2E", "#3A7D5C", "#B23A48", "#1F6F8B", "#C77F1A"];

export default function Settings() {
  const { business, refresh } = useAuth();
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(8);
  const [reward, setReward] = useState("");
  const [color, setColor] = useState("#473C6B");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setThreshold(business.reward_threshold);
    setReward(business.reward_description);
    setColor(business.brand_color);
  }, [business]);

  async function save() {
    if (!business) return;
    setBusy(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        reward_threshold: threshold,
        reward_description: reward.trim(),
        brand_color: color,
      })
      .eq("id", business.id);
    setBusy(false);
    if (error) {
      toast(error.message, "err");
      return;
    }
    await refresh();
    toast("Settings saved");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Tune your program. Changes apply to new stamps going forward.
        </p>
      </header>

      <div className="card space-y-6 p-6">
        <div>
          <label className="label" htmlFor="bname">
            Shop name
          </label>
          <input
            id="bname"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="bthresh">
            Stamps needed for a reward
          </label>
          <div className="flex items-center gap-4">
            <input
              id="bthresh"
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
          <label className="label" htmlFor="breward">
            Reward description
          </label>
          <input
            id="breward"
            className="field"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
          />
        </div>

        <div>
          <span className="label">Card accent</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  color === c ? "scale-110 border-ink" : "border-transparent"
                }`}
                style={{ background: c }}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="label">Preview</span>
          <PunchCard filled={Math.min(3, threshold)} threshold={threshold} />
        </div>

        <button onClick={save} disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
