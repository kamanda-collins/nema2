import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useFeatures } from "@/hooks/useFeatures";
import { useToast } from "@/hooks/use-toast";
import { FeatureSaveForm } from "./FeatureSaveForm";
import { FeaturePanelHeader } from "./FeaturePanelHeader";
import { FeatureAddButton } from "./FeatureAddButton";

export const FloatingFeaturePanel: React.FC = () => {
  // Panel expand/collapse
  const [isExpanded, setIsExpanded] = useState(true);

  // Track if a drawn shape is awaiting naming/saving
  const [pendingShape, setPendingShape] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { addFeature } = useFeatures();
  const { toast } = useToast();

  // Listen for "feature-shape-drawn" events and set pendingShape
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      setPendingShape(customEvent.detail);
      setIsExpanded(true);
    };
    window.addEventListener("feature-shape-drawn", handler as EventListener);
    return () => {
      window.removeEventListener("feature-shape-drawn", handler as EventListener);
    };
  }, []);

  // Handle saving the feature
  const handleSave = async (name: string, desc: string) => {
    if (!name.trim() || !pendingShape) {
      toast({ title: "Name required", description: "Please enter a feature name.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await addFeature({
        name,
        description: desc,
        category: "general",
        geo: JSON.stringify(pendingShape),
      });
      setPendingShape(null);
      toast({ title: "Feature saved", description: "Your feature was saved." });
    } catch (e) {
      toast({ title: "Error", description: "Could not save feature", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancellation (clear pendingShape)
  const handleCancel = () => {
    setPendingShape(null);
  };

  // If a shape is pending, ONLY show the save form - Enhanced with dark mode
  if (pendingShape) {
    return (
      <div className="absolute z-50 flex flex-row items-center justify-end pointer-events-auto transition-all animate-slide-up" style={{ top: 108, right: 24, minHeight: 48 }}>
        <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-700/50 shadow-2xl rounded-xl flex items-center p-0 transition-all duration-300 min-w-[340px]">
          <div className="flex flex-col w-full px-4 py-5">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Save Feature
            </h3>
            <FeatureSaveForm
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isSaving}
            />
          </div>
        </Card>
      </div>
    );
  }

  // Panel UI when not saving a new shape - Enhanced with dark mode
  return (
    <div className="absolute z-50 flex flex-row items-center justify-end pointer-events-auto transition-all"
      style={{ top: 108, right: 24, minHeight: 48 }}
    >
      <Card
        className={`
          backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-700/50 shadow-2xl rounded-full
          flex items-center p-0 transition-all duration-300
          ${isExpanded ? "h-14 min-w-[350px]" : "h-12 w-14 min-w-0"}
        `}
        style={{
          minWidth: isExpanded ? 350 : 56,
          height: isExpanded ? 56 : 48,
          overflow: "visible",
        }}
      >
        <div className="flex h-full items-center w-full relative">
          {/* Collapse/Expand Button - Premium gradient */}
          <Button
            onClick={() => setIsExpanded((v) => !v)}
            variant="ghost"
            size="icon"
            tabIndex={0}
            className={`
              group h-12 w-12 min-w-0 rounded-full border-0 flex items-center justify-center
              bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
              focus:outline-none focus:ring-2 focus:ring-blue-400 dark:ring-blue-500
              transition-all duration-150 absolute left-0 top-1/2 -translate-y-1/2
              z-10 shadow-lg
            `}
            aria-label={isExpanded ? "Collapse features panel" : "Expand features panel"}
          >
            {isExpanded ? (
              <ChevronRight className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
            )}
          </Button>
          {/* Panel Content */}
          <div
            className={`
              flex items-center transition-all duration-300
              ${isExpanded
                ? "opacity-100 pl-16 pr-4 py-2 w-[300px]"
                : "opacity-0 pl-14 pr-0 py-0 w-0 pointer-events-none"}
              overflow-hidden h-full relative
            `}
            aria-hidden={!isExpanded}
          >
            <div className="w-full">
              <FeaturePanelHeader
                rightContent={
                  <FeatureAddButton onClick={() => setPendingShape({ manual: true })} />
                }
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
