
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnvironmentalTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const primaryTabs = [
  { value: "overview", label: "Overview" },
  { value: "maps", label: "Maps" },
  { value: "analytics", label: "Analytics" },
  { value: "timeseries", label: "Time Series" },
  { value: "predictions", label: "Predictions" },
];

export const EnvironmentalTabs: React.FC<EnvironmentalTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  React.useEffect(() => {
    // Log visible tab triggers on mount/update
    console.log('[EnvironmentalTabs] Rendered tabs:', primaryTabs.map(t => t.label));
  }, []);
  return (
    <TabsList
      className={`
        flex w-full overflow-x-auto gap-1 min-h-[40px] bg-transparent scrollbar-hide
        sm:grid sm:w-full sm:grid-cols-5
      `}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {primaryTabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
