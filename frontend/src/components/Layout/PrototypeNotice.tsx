
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { X } from "lucide-react";

interface PrototypeNoticeProps {
  show: boolean;
  onClose: () => void;
}

export const PrototypeNotice: React.FC<PrototypeNoticeProps> = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="flex justify-center items-center pt-2 pb-1">
      <Alert className="w-fit bg-yellow-50 border-yellow-400 text-yellow-800 px-4 py-3 relative">
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-2 top-2 text-yellow-800 hover:text-yellow-600 bg-transparent border-none p-1"
        >
          <X size={16} />
        </button>
        <AlertTitle className="flex items-center gap-2">
          🚧 Interactive Prototype
        </AlertTitle>
        <AlertDescription>
          This app is a live interactive prototype. Some features and map layers are still in development and may not function fully.
        </AlertDescription>
      </Alert>
    </div>
  );
};
