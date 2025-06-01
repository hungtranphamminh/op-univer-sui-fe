/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useCallback } from "react";
import { Upload, FileText, Eye, AlertCircle, X } from "lucide-react";
import { formatFileSize } from "@/utils/lib/format-file";

export default function PdfUpload({
  selectedFile,
  handleFileSelect,
  isDragOver,
  setIsDragOver,
  fileInputRef,
  handleFileInputChange,
  handleRemoveFile,
  pdfUrl,
  isLoading,
  error,
  maxFileSize = 10, // Default to 10MB
}: {
  selectedFile: File | null;
  handleFileSelect: (file: File) => void;
  isDragOver: boolean;
  setIsDragOver: (isOver: boolean) => void;
  fileInputRef: any;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
  maxFileSize?: number; // in MB
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    [setIsDragOver]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    },
    [setIsDragOver]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Document Upload
      </h2>

      {!selectedFile && (
        <div
          className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                    ${
                      isDragOver
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }
                  `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload PDF Document
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your PDF file here, or click to browse
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Maximum file size: {maxFileSize}MB
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* File Info and PDF Viewer */}
      {selectedFile && pdfUrl && (
        <div className="space-y-4">
          {/* File Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)} • PDF Document
                  </p>
                </div>
              </div>

              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove PDF"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Document Preview
                </span>
              </div>
            </div>

            <div className="p-4">
              <iframe
                src={pdfUrl}
                className="w-full h-96 border border-gray-200 rounded"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
