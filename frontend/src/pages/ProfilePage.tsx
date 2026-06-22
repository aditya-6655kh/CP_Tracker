import React, {useState, useEffect} from "react";
import { CheckCircle2 } from "lucide-react";
import { getProfile, updateProfile } from "../api/profile.api";
import type { Profile } from "../types";

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [cfHandle, setCfHandle] =useState("");
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try{
                const data = await getProfile();
                if(data){
                    setProfile(data);
                    setCfHandle(data.cfHandle ?? '');
                }
            }finally{
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleSave = async () => {
        setError('');
        setSuccess(false);
        setSaving(true);

        try{
            const updated = await updateProfile({cfHandle});
            setProfile(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }catch(err : any){
            const errs = err.response?.data?.errors;
            setError(errs ? errs.join(', ') : err.response?.data?.message ?? "Failed to save.");
        }finally{
            setSaving(false);
        }
    }

    if(loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="font-mono text-sm text-slate-500 animate-pulse">Loading</p>
            </div>
        );
    }

    return (
      <div className="p-8 max-w-lg">
        <h1 className="font-mono text-2xl font-semibold text-white mb-1">
          Profile
        </h1>
        <p className="font-mono text-sm text-slate-500 mb-8">
          Manage your competetive programming handles.
        </p>

        <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6 space-y-5">
          {/* Codeforces */}
          <div>
            <label className="block font-mono text-xs text-slate-500 mb-1.5">
              Codeforces Handle
            </label>
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="e.g. tourist"
              className="w-full bg-[#0A0A0F] border border-[#2D2D3F] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {/* LeetCode — disabled until Phase 2 */}
          <div>
            <label className="block font-mono text-xs text-slate-500 mb-1.5">
              LeetCode Handle
              <span className="ml-2 text-slate-600">(coming soon)</span>
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. neal_wu"
              className="w-full bg-[#0A0A0F] border border-[#2D2D3F] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-slate-600 opacity-40 cursor-not-allowed"
            />
          </div>

          {/* GFG — disabled until Phase 2 */}
          <div>
            <label className="block font-mono text-xs text-slate-500 mb-1.5">
              GeeksforGeeks Handle
              <span className="ml-2 text-slate-600">(coming soon)</span>
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. myhandle"
              className="w-full bg-[#0A0A0F] border border-[#2D2D3F] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-slate-600 opacity-40 cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}
          {success && (
            <div className="px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Profile saved.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    );
}

export default ProfilePage;