import { Send } from "lucide-react";

export default function Sidebar({
  selectedFile,
  documentTitle,
  setDocumentTitle,
  documentDescription,
  setDocumentDescription,
  addOwnSignature,
  signedMessage,
  signatureImage,
  signers,
  handlePublish,
}: {
  selectedFile: File | null;
  documentTitle: string;
  setDocumentTitle: (title: string) => void;
  documentDescription: string;
  setDocumentDescription: (description: string) => void;
  addOwnSignature: boolean;
  signedMessage?: string;
  signatureImage?: File | null;
  signers: { address: string; name?: string }[];
  handlePublish: () => void;
}) {
  return (
    <>
      <div className="space-y-6">
        {/* Document Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Document Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title *
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Employment Contract"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the document..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedFile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Document:</span>
                <span className="text-gray-900 font-medium">
                  {selectedFile.name.length > 20
                    ? selectedFile.name.slice(0, 20) + "..."
                    : selectedFile.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Your Signature:</span>
                <span className="text-gray-900">
                  {addOwnSignature
                    ? signedMessage && signatureImage
                      ? "Complete"
                      : "In Progress"
                    : "No"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Other Signers:</span>
                <span className="text-gray-900">{signers.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Total Signers:</span>
                <span className="text-gray-900 font-medium">
                  {(addOwnSignature ? 1 : 0) + signers.length}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handlePublish}
                disabled={
                  !selectedFile ||
                  !documentTitle.trim() ||
                  (addOwnSignature && (!signedMessage || !signatureImage))
                }
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Publish Document
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">
                Publishing will require a blockchain transaction
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
