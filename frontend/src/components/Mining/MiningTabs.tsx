
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MiningTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const MiningTabs: React.FC<MiningTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <TabsList
      className={`
        flex w-full overflow-x-auto scrollbar-hide gap-1 min-h-[36px] bg-transparent
        sm:grid sm:w-full sm:grid-cols-6
      `}
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      <TabsTrigger value="overview" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Overview
      </TabsTrigger>
      <TabsTrigger value="operations" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Operations
      </TabsTrigger>
      <TabsTrigger value="geological" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Geological
      </TabsTrigger>
      <TabsTrigger value="equipment" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Equipment
      </TabsTrigger>
      <TabsTrigger value="safety" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Safety
      </TabsTrigger>
      <TabsTrigger value="environmental" className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm">
        Environmental
      </TabsTrigger>
    </TabsList>
  );
};
