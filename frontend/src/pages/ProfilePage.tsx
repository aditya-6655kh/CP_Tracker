import { getApiErrorMessage } from "../utilities/api-error";
import React, {useState} from "react";
import { CheckCircle2 } from "lucide-react";
import { updateProfile } from "../api/profile.api";
import { useProfile } from "../context/profile-context";

const ProfilePage: React.FC = () => {
    const {profile, loading: profileLoading, refetch} = useProfile()
    const [leetcodeDraft, setLeetcodeHandle] = useState<string | null>(null);
    const leetcodeHandle = leetcodeDraft ?? profile?.leetcodeHandle ?? '';
    const [cfDraft, setCfHandle] = useState<string | null>(null);
    const cfHandle = cfDraft ?? profile?.cfHandle ?? '';
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');


    const handleSave = async () => {
        setError('');
        setSuccess(false);
        setSaving(true);

        try{
            await updateProfile({ cfHandle, leetcodeHandle });
            await refetch();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }catch(err: unknown){
            setError(getApiErrorMessage(err, "Failed to save."));
        }finally{
            setSaving(false);
        }
    }

    if(profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="font-mono text-sm text-slate-500 animate-pulse">Loading Profile...</p>
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
            </label>
            <input
              type="text"
              value={leetcodeHandle}
              onChange={(e) => setLeetcodeHandle(e.target.value)}
              placeholder="e.g. neal_wu"
              className="w-full bg-[#0A0A0F] border border-[#2D2D3F] rounded-lg px-3 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors "
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