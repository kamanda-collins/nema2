
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface FeatureSaveFormProps {
  initialName?: string;
  initialDesc?: string;
  onSave: (name: string, desc: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FeatureSaveForm: React.FC<FeatureSaveFormProps> = ({
  initialName = "",
  initialDesc = "",
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [featureName, setFeatureName] = useState(initialName);
  const [featureDesc, setFeatureDesc] = useState(initialDesc);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-slate-800 rounded-xl px-2 py-2 border border-blue-100 dark:border-slate-600 mt-2 shadow">
      <input
        ref={nameInputRef}
        type="text"
        className="border border-gray-300 dark:border-slate-600 px-2 py-1 rounded text-sm focus:ring focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        placeholder="Feature name"
        value={featureName}
        onChange={e => setFeatureName(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        className="border border-gray-300 dark:border-slate-600 px-2 py-1 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        placeholder="Description (optional)"
        value={featureDesc}
        onChange={e => setFeatureDesc(e.target.value)}
        disabled={isLoading}
      />
      <div className="flex justify-end mt-1 gap-2">
        <Button
          className="px-3 py-1 text-xs rounded"
          size="sm"
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          className="px-3 py-1 text-xs rounded"
          size="sm"
          type="button"
          disabled={!featureName.trim() || isLoading}
          onClick={() => onSave(featureName, featureDesc)}
        >
          Save Feature
        </Button>
      </div>
    </div>
  );
};
