import React from "react";
import type { CodeforcesActivityDay } from "../../types";

interface Props {
  activity: CodeforcesActivityDay[];
}

const DAYS_TO_SHOW = 182;

function getColor(count: number): string {
  if (count === 0) return "#1A1A24";
  if (count <= 2) return "#1E3A2F";
  if (count <= 5) return "#2D6A4F";
  if (count <= 10) return "#40916C";
  return "#52B788";
}

const ActivityHeatmap: React.FC<Props> = ({ activity }) => {
  const activityMap = new Map(activity.map((a) => [a.date, a.count]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days: CodeforcesActivityDay[] = [];
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const dayStr = new Date(today.getTime() - i * 86400000)
      .toISOString()
      .slice(0, 10);
    days.push({ date: dayStr, count: activityMap.get(dayStr) ?? 0 });
  }

  const firstDayOfWeek = new Date(days[0].date).getDay();
  const padded: ((typeof days)[0] | null)[] = Array(firstDayOfWeek)
    .fill(null)
    .concat(days);

  const weeks: ((typeof days)[0] | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const totalSubmissions = activity.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-mono text-sm text-white mb-2">Activity</h3>
        <span className="font-mono text-xs text-slate-500">
          {totalSubmissions.toLocaleString()} submissions · last{" "}
          {Math.round(DAYS_TO_SHOW / 30)} months
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, widx) => (
          <div key={widx} className="flex flex-col gap-1">
            {week.map((day, didx) =>
              day ? (
                <div
                  key={didx}
                  title={`${day.date}: ${day.count} submission${day.count !== 1 ? "s" : ""}`}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getColor(day.count) }}
                />
              ) : (
                <div key={`pad-${widx}-${didx}`} className="w-3 h-3" />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="font-mono text-xs text-slate-500">Less</span>
        {[0, 2, 5, 10, 15].map((c) => (
          <div
            className="w-3 h-3 rounded-sm"
            key={c}
            style={{ backgroundColor: getColor(c) }}
          />
        ))}
        <span className="font-mono text-xs text-slate-500">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;