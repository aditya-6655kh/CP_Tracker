import React from "react";
import type { CodeforcesRatingPoint } from "../../types";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

interface Props {
  ratingHistory: CodeforcesRatingPoint[];
}

const RatingChart: React.FC<Props> = ({ ratingHistory }) => {
  if (!ratingHistory || ratingHistory.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6">
        <h3 className="font-mono text-sm font-semibold text-white mb-2">
          Rating History
        </h3>
        <p className="font-mono text-sm text-slate-500">
          No rated contests yet — participate in a Div. 2/3 round to see your
          graph here.
        </p>
      </div>
    );
  }

  const data = ratingHistory.map((point) => ({
    date: new Date(point.ratingUpdateTimeSeconds * 1000).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    ),
    rating: point.newRating,
    contestName: point.contestName,
    rank: point.rank,
  }));

  return (
    <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-6">
      <h3 className="font-mono text-sm font-semibold text-white mb-5">
        Rating History
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#2D2D3F"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fontSize: 11, fontFamily: "monospace" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0A0A0F",
              border: "1px solid #2D2D3F",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#fff", marginBottom: 4 }}
            formatter={(value: number, _name: string, props: any) => [
              `Rating: ${value} (rank ${props.payload.rank})`,
              props.payload.contestName,
            ]}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#818CF8"
            strokeWidth={2}
            dot={{ r: 3, fill: "#818CF8" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RatingChart;