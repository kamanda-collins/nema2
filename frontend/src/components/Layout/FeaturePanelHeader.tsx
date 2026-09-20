
import React from "react";
import { Settings } from "lucide-react";

interface FeaturePanelHeaderProps {
  rightContent?: React.ReactNode;
}

export const FeaturePanelHeader: React.FC<FeaturePanelHeaderProps> = ({
  rightContent,
}) => (
  <div className="flex flex-row items-center gap-2 w-full">
    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center border border-blue-100">
      <Settings className="h-4 w-4 text-blue-600" />
    </div>
    <h3 className="font-semibold text-sm whitespace-nowrap text-gray-800">
      Features
    </h3>
    {/* Fill empty space if rightContent present, else flex-1 */}
    <div className="flex-1 min-w-0 max-w-[120px]" />
    {rightContent && (
      <div className="">{rightContent}</div>
    )}
  </div>
);
