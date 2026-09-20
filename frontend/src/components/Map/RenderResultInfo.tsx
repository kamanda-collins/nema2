
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Code } from 'lucide-react';

export interface RenderResultInfoProps {
  renderResult: any;
  downloadScript: () => void;
}

export const RenderResultInfo: React.FC<RenderResultInfoProps> = ({
  renderResult,
  downloadScript,
}) =>
  !renderResult ? null : (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-800">Rendering Complete</span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Render ID:</span>
          <p className="font-mono text-xs">{renderResult.render_id}</p>
        </div>
        <div>
          <span className="text-gray-600">Processing Time:</span>
          <p>{renderResult.processing_time_ms}ms</p>
        </div>
        <div>
          <span className="text-gray-600">Output Size:</span>
          <p>{renderResult.output_info.width} × {renderResult.output_info.height}px</p>
        </div>
        <div>
          <span className="text-gray-600">Features Rendered:</span>
          <p>{renderResult.features_rendered}</p>
        </div>
      </div>
      <Button
        onClick={downloadScript}
        variant="outline"
        size="sm"
        className="mt-3"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Python Script
      </Button>
    </div>
);
