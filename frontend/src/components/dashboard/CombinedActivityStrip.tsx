import React from "react";

interface PlatformActivity {
  date: string;
  count: number;
}

interface Props {
  cfActivity: PlatformActivity[];
  lcActivity: PlatformActivity[];
  daysToShow?: number;
}

function getColor(count: number): string {
  if (count === 0) return "#1A1A24";
  if (count <= 2) return "#1E3A2F";
  if (count <= 5) return "#2D6A4F";
  if (count <= 10) return "#40916C";
  return "#52B788";
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const CombinedActivityStrip: React.FC<Props> = ({
  cfActivity,
  lcActivity,
  daysToShow = 30,
}) => {
  const cfMap = new Map(cfActivity.map((a) => [a.date, a.count]));
  const lcMap = new Map(lcActivity.map((a) => [a.date, a.count]));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const days = [];

  for (let i = daysToShow - 1; i >= 0; i--) {
    const dateStr = new Date(today.getTime() - i * 86400000)
      .toISOString()
      .slice(0, 10);
    const cfCount = cfMap.get(dateStr) ?? 0;
    const lcCount = lcMap.get(dateStr) ?? 0;

    days.push({
      date: dateStr,
      cfCount,
      lcCount,
      total: cfCount + lcCount,
    });
  }

  const combined = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-mono text-sm font-semibold text-white">
          Combined Activity
        </h3>
        <span className="font-mono text-xs text-slate-500">
          {combined.toLocaleString()} submissions · last {daysToShow} days
        </span>
      </div>

      <div className="flex gap-1.5">
        {days.map((day) => (
          <div
            key={day.date}
            title={[
              formatDateLabel(day.date),
              `Codeforces: ${day.cfCount}`,
              `LeetCode: ${day.lcCount}`,
              `Total: ${day.total}`,
            ].join("\n")}
            className="flex-1 aspect-square rounded-sm"
            style={{ backgroundColor: getColor(day.total) }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="font-mono text-xs text-slate-500">Less</span>
        {[0, 2, 5, 10, 15].map((c) => (
          <div
            key={c}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(c) }}
          />
        ))}
        <span className="font-mono text-xs text-slate-500">More</span>
      </div>
    </div>
  );
};

export default CombinedActivityStrip;