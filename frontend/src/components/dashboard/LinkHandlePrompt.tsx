import React from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface LinkHandlePromptProps {
  icon: LucideIcon;
  platformName: string;
  description: string;
}

const LinkHandlePrompt: React.FC<LinkHandlePromptProps> = ({
  icon: Icon,
  platformName,
  description,
}) => (
  <div className="bg-[#12121A] border border-[#2D2D3F] rounded-xl p-8 max-w-md">
    <Icon className="w-7 h-7 text-indigo-400 mb-4" />
    <h2 className="font-mono text-white font-semibold mb-2">
      Link your {platformName} handle
    </h2>
    <p className="font-mono text-sm text-slate-500 mb-5">{description}</p>
    <Link
      to="/profile"
      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm px-4 py-2 rounded-lg transition-colors"
    >
      Go to Profile →
    </Link>
  </div>
);

export default LinkHandlePrompt;
