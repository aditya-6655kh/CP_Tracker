import React from "react";
import type { CodeforcesStreak } from "../../types";
import { Flame, Trophy } from "lucide-react";

interface Props{
    streak: CodeforcesStreak;
}

const StreakCard: React.FC<Props> = ({streak}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Flame className={`w-4 h-4 ${streak.current > 0 ? 'text-orange-400' : 'text-slate-500'}`}/>
                    <span className="font-mono text-xs text-slate-500">Current Streak</span>
                </div>
                <p className="font-mono text-3xl font-bold text-white">{streak.current}</p>
                <p className="font-mono text-xs mt-1 text-slate-500">day{streak.current !== 1 ? 's' : ''}</p>
            </div>

            <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className={`w-4 h-4 ${streak.max > 0 ? 'text-orange-400' : 'text-slate-500'}`}/>
                    <span className="font-mono text-xs text-slate-500">Max Streak</span>
                </div>
                <p className="font-mono text-3xl font-bold text-white">{streak.max}</p>
                <p className="font-mono text-xs mt-1 text-slate-500">day{streak.max !== 1 ? 's' : ''}</p>
            </div>
        </div>
    );
}

export default StreakCard;