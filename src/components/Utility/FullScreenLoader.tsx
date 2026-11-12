import React from "react";

interface FullScreenLoaderProps {
  show: boolean;
  message?: string;
  subMessage?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  show,
  message = "Saving data to Google Sheet...",
  subMessage = "Please wait, do not close or refresh this page."
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-2xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700 max-w-sm text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-100">
          {message}
        </p>
        {subMessage && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};