
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FeatureAddButtonProps {
  onClick: () => void;
}

export const FeatureAddButton: React.FC<FeatureAddButtonProps> = ({ onClick }) => (
  <Button
    size="sm"
    variant="outline"
    className="text-xs px-2 py-1 h-auto w-fit flex items-center gap-1" // Removed mt-1
    onClick={onClick}
  >
    <Plus className="h-4 w-4 mr-1" />
    Add Feature
  </Button>
);
