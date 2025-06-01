"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useSignAndExecuteTransaction,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { API_BASE_URL } from "@/utils/const";

// TODO: add ellipsis for too long of an address -> user

// Types
interface DocumentData {
  documentId: string;
  title: string;
  description?: string;
  publisherAddress: string;
  publisherHasSigned: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  blockchainTxHash?: string;
  suiObjectId?: string;
  publishedAt?: string;
  signers: Array<{
    address: string;
    name?: string;
    email?: string;
    hasSigned: boolean;
    signedAt?: string;
  }>;
  signedCount: number;
  totalSigners: number;
  isReadyForBlockchain: boolean;
  finalPdfHash?: string;
  pdfUrl: string;
  pdfBase64: string;
}

interface BlockchainTransactionData {
  documentId: string;
  title: string;
  description: string;
  pdfHashBytes: number[];
  signerAddresses: string[];
  transactionParams: {
    packageId: string;
    registryObjectId: string;
    clockObjectId: string;
  };
  estimatedGasCost: string;
  finalPdfHash: string;
  totalSigners: number;
  publisherAddress: string;
}

// API Functions
const retrieveFullDocument = async (
  documentId: string
): Promise<DocumentData> => {
  try {
    // Get the PDF content
    const pdfResponse = await fetch(
      `${API_BASE_URL}/documents/${documentId}/pdf`
    );
    if (!pdfResponse.ok) throw new Error("Failed to fetch document PDF");

    const pdfResult = await pdfResponse.json();
    const pdfBase64 = pdfResult.data.pdf;

    // Convert base64 to blob URL for PDF display
    const pdfBlob = new Blob(
      [Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Get document info
    const infoResponse = await fetch(`${API_BASE_URL}/documents/${documentId}`);
    if (!infoResponse.ok) throw new Error("Failed to fetch document info");

    const infoResult = await infoResponse.json();
    const docInfo = infoResult.data;

    // Get detailed status
    const statusResponse = await fetch(
      `${API_BASE_URL}/documents/${documentId}/status`
    );
    if (!statusResponse.ok) throw new Error("Failed to fetch document status");

    const statusResult = await statusResponse.json();
    const statusInfo = statusResult.data;

    // Combine all data
    const fullDocumentData: DocumentData = {
      documentId: docInfo.documentId,
      title: docInfo.title,
      description: docInfo.description,
      publisherAddress: docInfo.publisherAddress,
      publisherHasSigned: docInfo.publisherHasSigned,
      status: docInfo.status,
      createdAt: docInfo.createdAt,
      updatedAt: docInfo.updatedAt,
      blockchainTxHash: docInfo.blockchainTxHash,
      suiObjectId: docInfo.suiObjectId,
      publishedAt: docInfo.publishedAt,
      signers: statusInfo.signers,
      signedCount: statusInfo.signedCount,
      totalSigners: statusInfo.totalSigners,
      isReadyForBlockchain: statusInfo.isReadyForBlockchain,
      finalPdfHash: statusInfo.finalPdfHash,
      pdfUrl: pdfUrl,
      pdfBase64: pdfBase64,
    };

    return fullDocumentData;
  } catch (error) {
    console.error("❌ Failed to retrieve document:", error);
    throw error;
  }
};

const createBlockchainTransaction = async (
  documentId: string
): Promise<BlockchainTransactionData> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}/create-blockchain-transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok)
      throw new Error("Failed to create blockchain transaction data");

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("❌ Failed to create blockchain transaction:", error);
    throw error;
  }
};

const confirmBlockchainPublication = async (
  documentId: string,
  transactionDigest: string,
  suiObjectId?: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}/confirm-blockchain-publication`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionDigest,
          suiObjectId,
        }),
      }
    );

    if (!response.ok)
      throw new Error("Failed to confirm blockchain publication");

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("❌ Failed to confirm blockchain publication:", error);
    throw error;
  }
};

export default function RequestApprovedPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  // State
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [transactionData, setTransactionData] =
    useState<BlockchainTransactionData | null>(null);

  const loadDocument = async (documentId: string) => {
    setError(null);
    try {
      const data = await retrieveFullDocument(documentId);
      setDocumentData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    }
  };

  const handlePublishToBlockchain = async () => {
    if (!documentData || !currentAccount) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      //Request blockchain transaction data from backend
      console.log("📋 Requesting blockchain transaction data from backend...");
      const txData = await createBlockchainTransaction(documentData.documentId);
      setTransactionData(txData);

      console.log("📄 Transaction Data:", txData);

      // Validate transaction parameters
      if (
        !txData.transactionParams.packageId ||
        txData.transactionParams.packageId === "YOUR_PACKAGE_ID"
      ) {
        throw new Error(
          "Package ID not configured. Please set SUI_PACKAGE_ID in backend environment."
        );
      }

      if (
        !txData.transactionParams.registryObjectId ||
        txData.transactionParams.registryObjectId === "YOUR_REGISTRY_OBJECT_ID"
      ) {
        throw new Error(
          "Registry Object ID not configured. Please set SUI_REGISTRY_OBJECT_ID in backend environment."
        );
      }

      //Create Sui transaction using backend data
      console.log("🔗 Creating Sui transaction...");
      const transaction = new Transaction();

      // Add the publish_document transaction with data from backend
      // transaction.moveCall({
      //   target: `${txData.transactionParams.packageId}::contract::publish_document`,
      //   arguments: [
      //     transaction.sharedObjectRef({
      //       objectId: txData.transactionParams.registryObjectId,
      //       initialSharedVersion: 1,
      //       mutable: true,
      //     }),
      //     transaction.pure.string(txData.documentId),
      //     transaction.pure.string(txData.title),
      //     transaction.pure.string(txData.description),
      //     transaction.pure(new Uint8Array(txData.pdfHashBytes)),
      //     transaction.pure.vector("address", txData.signerAddresses),
      //     transaction.sharedObjectRef({
      //       objectId: txData.transactionParams.clockObjectId,
      //       initialSharedVersion: 1,
      //       mutable: false,
      //     }),
      //   ],
      // });

      const registry = transaction.object(
        txData.transactionParams.registryObjectId
      );
      const documentId = transaction.pure.string(txData.documentId);
      const title = transaction.pure.string(txData.title);
      const description = transaction.pure.string(txData.description);
      const pdfHash = transaction.pure.vector("u8", txData.pdfHashBytes);
      const signers = transaction.pure.vector(
        "address",
        txData.signerAddresses
      );
      const clock = transaction.object("0x6");

      transaction.moveCall({
        target: `${txData.transactionParams.packageId}::contract::publish_document`,
        arguments: [
          registry,
          documentId,
          title,
          description,
          pdfHash,
          signers,
          clock,
        ],
      });

      //Execute transaction
      const result = await signAndExecuteTransaction({
        transaction,
      });

      // For now, we'll pass undefined for suiObjectId - the backend can extract it later if needed
      const suiObjectId = undefined;

      //Confirm publication with backend
      console.log("💾 Confirming publication with backend...");
      const confirmResult = await confirmBlockchainPublication(
        documentData.documentId,
        result.digest,
        suiObjectId
      );

      console.log("✅ Backend confirmation:", confirmResult);

      // Step 6: Reload document data to show updated status
      console.log("🔄 Reloading document data...");
      await loadDocument(documentData.documentId);

      console.log("🎉 Document successfully published to blockchain!");
    } catch (err: any) {
      console.error("❌ Failed to publish to blockchain:", err);
      setPublishError(err.message || "Failed to publish to blockchain");
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (documentData?.pdfUrl) {
        URL.revokeObjectURL(documentData.pdfUrl);
      }
    };
  }, [documentData]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={() => documentId && loadDocument(documentId)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading document...</p>
      </div>
    );
  }

  const canPublish =
    documentData.status === "ready_for_blockchain" &&
    currentAccount?.address === documentData.publisherAddress;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Document Info Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {documentData.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Document ID</h3>
            <p className="text-sm text-gray-900 font-mono">
              {documentData.documentId}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                documentData.status === "published"
                  ? "bg-green-100 text-green-800"
                  : documentData.status === "ready_for_blockchain"
                  ? "bg-blue-100 text-blue-800"
                  : documentData.status === "awaiting_signatures"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {documentData.status}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Publisher</h3>
            <p className="text-sm text-gray-900 font-mono">
              {documentData.publisherAddress}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Signatures</h3>
            <p className="text-sm text-gray-900">
              {documentData.signedCount}/{documentData.totalSigners} completed
            </p>
          </div>
        </div>

        {documentData.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-900">{documentData.description}</p>
          </div>
        )}

        {/* Blockchain Publication Section */}
        {canPublish && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              🚀 Ready for Blockchain Publication
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              All signatures have been collected. You can now publish this
              document to the Sui blockchain for permanent verification.
            </p>

            {/* Show transaction details if available */}
            {transactionData && (
              <div className="mb-4 p-3 bg-white border rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Transaction Details
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Document:</strong> {transactionData.title}
                  </p>
                  <p>
                    <strong>PDF Hash:</strong> {transactionData.finalPdfHash}
                  </p>
                  <p>
                    <strong>Signers:</strong> {transactionData.totalSigners}
                  </p>
                  <p>
                    <strong>Estimated Gas:</strong>{" "}
                    {(
                      parseInt(transactionData.estimatedGasCost) / 1000000000
                    ).toFixed(4)}{" "}
                    SUI
                  </p>
                </div>
              </div>
            )}

            {publishError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">{publishError}</p>
              </div>
            )}

            <button
              onClick={handlePublishToBlockchain}
              disabled={isPublishing || !currentAccount}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPublishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing to Blockchain...
                </>
              ) : (
                <>
                  <span className="mr-2">📝</span>
                  Publish to Blockchain
                </>
              )}
            </button>

            {!currentAccount && (
              <p className="text-xs text-blue-600 mt-2">
                Please connect your wallet to publish
              </p>
            )}
          </div>
        )}

        {/* Signers Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Signers</h3>
          <div className="space-y-2">
            {/* Publisher */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Publisher</p>
                <p className="text-xs text-gray-500 font-mono">
                  {documentData.publisherAddress}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  documentData.publisherHasSigned
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {documentData.publisherHasSigned ? "✓ Signed" : "Pending"}
              </span>
            </div>

            {/* Other Signers */}
            {documentData.signers.map((signer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {signer.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {signer.address}
                  </p>
                  {signer.email && (
                    <p className="text-xs text-gray-400">{signer.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      signer.hasSigned
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {signer.hasSigned ? "✓ Signed" : "Pending"}
                  </span>
                  {signer.signedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(signer.signedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Info */}
        {documentData.blockchainTxHash && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              ✅ Blockchain Publication
            </h3>
            <p className="text-xs text-green-700 font-mono">
              TX: {documentData.blockchainTxHash}
            </p>
            {documentData.suiObjectId && (
              <p className="text-xs text-green-700 font-mono">
                Object ID: {documentData.suiObjectId}
              </p>
            )}
            {documentData.publishedAt && (
              <p className="text-xs text-green-600">
                Published: {new Date(documentData.publishedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Document Preview
          </h2>
          <p className="text-sm text-gray-500">
            Signed PDF with all signatures
          </p>
        </div>

        <div className="p-4">
          <iframe
            src={documentData.pdfUrl}
            className="w-full h-96 border border-gray-200 rounded"
            title="Document Preview"
          />

          <div className="mt-4 flex space-x-2">
            <a
              href={documentData.pdfUrl}
              download={`${documentData.title}.pdf`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Download PDF
            </a>

            <button
              onClick={() => loadDocument(documentData.documentId)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
