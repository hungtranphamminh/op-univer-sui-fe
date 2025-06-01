"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Eye,
  AlertCircle,
  PenTool,
  Send,
  Check,
  Image,
  User,
  Download,
  Shield,
  Clock,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";

import { DocumentData, SignerInfo } from "@/types/document";
import { API_BASE_URL } from "@/utils/const";

export default function PartnerDocumentSignPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") || "";

  // Wallet integration
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // Document state
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [signerInfo, setSignerInfo] = useState<SignerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Signature state
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
    null
  );
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
  const [signatureSubmitted, setSignatureSubmitted] = useState(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);

  // API Functions
  const retrieveDocumentForSigning = async (
    docId: string
  ): Promise<DocumentData> => {
    try {
      // Get the PDF content
      const pdfResponse = await fetch(`${API_BASE_URL}/documents/${docId}/pdf`);
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
      const infoResponse = await fetch(`${API_BASE_URL}/documents/${docId}`);
      if (!infoResponse.ok) throw new Error("Failed to fetch document info");

      const infoResult = await infoResponse.json();
      const docInfo = infoResult.data;

      // Get detailed status
      const statusResponse = await fetch(
        `${API_BASE_URL}/documents/${docId}/status`
      );
      if (!statusResponse.ok)
        throw new Error("Failed to fetch document status");

      const statusResult = await statusResponse.json();
      const statusInfo = statusResult.data;

      return {
        documentId: docInfo.documentId,
        title: docInfo.title,
        description: docInfo.description,
        publisherAddress: docInfo.publisherAddress,
        publisherHasSigned: docInfo.publisherHasSigned,
        status: docInfo.status,
        createdAt: docInfo.createdAt,
        updatedAt: docInfo.updatedAt,
        signers: statusInfo.signers,
        signedCount: statusInfo.signedCount,
        totalSigners: statusInfo.totalSigners,
        isReadyForBlockchain: statusInfo.isReadyForBlockchain,
        pdfUrl: pdfUrl,
        pdfBase64: pdfBase64,
      };
    } catch (error) {
      console.error("❌ Failed to retrieve document:", error);
      throw error;
    }
  };

  const submitSignature = async (
    docId: string,
    signerAddress: string,
    signature: string,
    signatureImageFile: File
  ) => {
    try {
      const formData = new FormData();
      formData.append("signerAddress", signerAddress);
      formData.append("signature", signature);
      formData.append("signatureImage", signatureImageFile);

      const response = await fetch(`${API_BASE_URL}/documents/${docId}/sign`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || "Failed to submit signature");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("❌ Failed to submit signature:", error);
      throw error;
    }
  };

  // Load document data
  const loadDocument = async (docId: string) => {
    if (!docId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await retrieveDocumentForSigning(docId);
      setDocumentData(data);

      // Find current user in signers list
      if (currentAccount) {
        const currentSigner = data.signers.find(
          (signer) =>
            signer.address.toLowerCase() ===
            currentAccount.address.toLowerCase()
        );
        setSignerInfo(currentSigner || null);

        // Generate signature message if user is authorized and hasn't signed
        if (currentSigner && !currentSigner.hasSigned) {
          const message = `I agree to sign the PDF document with ID: ${data.documentId}`;
          setSignatureMessage(message);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument(documentId);
  }, [currentAccount, documentId]);

  // Handle wallet message signing
  const handleSignMessage = async () => {
    if (!signatureMessage || !currentAccount) return;

    setIsSigningMessage(true);
    try {
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(signatureMessage),
      });

      setSignedMessage(signature.signature);
      setError(null);
    } catch (err) {
      console.error("Failed to sign message:", err);
      setError("Failed to sign message. Please try again.");
    } finally {
      setIsSigningMessage(false);
    }
  };

  // Handle signature image upload
  const handleSignatureImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file for your signature.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Signature image must be less than 5MB.");
      return;
    }

    try {
      if (signatureImageUrl) {
        URL.revokeObjectURL(signatureImageUrl);
      }

      const url = URL.createObjectURL(file);
      setSignatureImageUrl(url);
      setSignatureImage(file);
      setError(null);
    } catch (err) {
      setError("Failed to load signature image.");
    }
  };

  // Remove signature image
  const handleRemoveSignatureImage = () => {
    if (signatureImageUrl) {
      URL.revokeObjectURL(signatureImageUrl);
    }
    setSignatureImage(null);
    setSignatureImageUrl(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  };

  // Submit complete signature
  const handleSubmitSignature = async () => {
    if (
      !documentData ||
      !currentAccount ||
      !signedMessage ||
      !signatureImage ||
      !signerInfo
    ) {
      setError("Please complete both signature steps before submitting.");
      return;
    }

    setIsSubmittingSignature(true);
    setError(null);

    try {
      await submitSignature(
        documentData.documentId,
        currentAccount.address,
        signedMessage,
        signatureImage
      );

      setSignatureSubmitted(true);

      // Reload document to show updated status
      await loadDocument(documentData.documentId);

      console.log("✅ Signature submitted successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to submit signature");
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (documentData?.pdfUrl) {
        URL.revokeObjectURL(documentData.pdfUrl);
      }
      if (signatureImageUrl) {
        URL.revokeObjectURL(signatureImageUrl);
      }
    };
  }, [documentData, signatureImageUrl]);

  // Authorization checks
  const isAuthorizedSigner = signerInfo !== null;
  const hasAlreadySigned = signerInfo?.hasSigned || false;

  const isSignatureComplete = signedMessage && signatureImage;

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Wallet Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please connect your Sui wallet to sign documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Document Signing
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and sign the document with your wallet
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading document...</p>
          </div>
        )}

        {/* Document Content */}
        {documentData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {documentData.title}
                    </h2>
                    {documentData.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {documentData.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
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

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Document ID:</span>
                    <p className="font-mono text-gray-900">
                      {documentData.documentId}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Publisher:</span>
                    <p className="font-mono text-gray-900">
                      {documentData.publisherAddress.slice(0, 10)}...
                      {documentData.publisherAddress.slice(-8)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="text-gray-900">
                      {documentData.signedCount}/{documentData.totalSigners}{" "}
                      signatures
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-gray-900">
                      {new Date(documentData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-medium text-gray-900">
                        Document Preview
                      </span>
                    </div>
                    <a
                      href={documentData.pdfUrl}
                      download={`${documentData.title}.pdf`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </a>
                  </div>
                </div>

                <div className="p-4">
                  <iframe
                    src={documentData.pdfUrl}
                    className="w-full h-96 border border-gray-200 rounded"
                    title="Document Preview"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Signer Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Your Signing Status
                </h3>

                {!isAuthorizedSigner && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-800">
                        Not Authorized
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Your wallet address is not in the list of required signers
                      for this document.
                    </p>
                  </div>
                )}

                {/* Already signed status */}
                {hasAlreadySigned && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Already Signed
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You have successfully signed this document.
                    </p>
                    {signerInfo?.signedAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Signed: {new Date(signerInfo.signedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Signing closed status */}
                {!hasAlreadySigned &&
                  documentData.status !== "awaiting_signatures" && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-800">
                          Signing Closed
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        This document is no longer accepting signatures.
                      </p>
                    </div>
                  )}

                {/* Signature submitted status */}
                {!hasAlreadySigned &&
                  documentData.status === "awaiting_signatures" &&
                  signatureSubmitted && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Signature Submitted!
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Your signature has been successfully submitted and added
                        to the document.
                      </p>
                    </div>
                  )}

                {/* Ready to sign status */}
                {!hasAlreadySigned &&
                  documentData.status === "awaiting_signatures" &&
                  !signatureSubmitted && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Ready to Sign
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          You are authorized to sign this document.
                        </p>
                      </div>

                      {/* Signature Process */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Signature Process
                        </h4>

                        {/* Step 1: Sign Message */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900">
                              Step 1: Sign Agreement
                            </h5>
                            {signedMessage && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs">Completed</span>
                              </div>
                            )}
                          </div>

                          {signatureMessage && (
                            <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 mb-3">
                              {signatureMessage}
                            </div>
                          )}

                          {!signedMessage ? (
                            <button
                              onClick={handleSignMessage}
                              disabled={isSigningMessage || !signatureMessage}
                              className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSigningMessage ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Signing...
                                </>
                              ) : (
                                <>
                                  <PenTool className="w-4 h-4 mr-2" />
                                  Sign with Wallet
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                              ✓ Agreement signed with wallet
                            </div>
                          )}
                        </div>

                        {/* Step 2: Upload Signature Image */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900">
                              Step 2: Upload Signature
                            </h5>
                            {signatureImage && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs">Completed</span>
                              </div>
                            )}
                          </div>

                          {!signatureImage ? (
                            <div>
                              <input
                                ref={signatureInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureImageChange}
                                className="hidden"
                              />
                              <button
                                onClick={() =>
                                  signatureInputRef.current?.click()
                                }
                                disabled={!signedMessage}
                                className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Image className="w-4 h-4 mr-2" />
                                Choose Signature Image
                              </button>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, or other image formats. Max 5MB.
                              </p>

                              {!signedMessage && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Please sign the agreement first
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded border">
                                <img
                                  src={signatureImageUrl!}
                                  alt="Signature"
                                  className="h-12 w-auto border rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {signatureImage.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(signatureImage.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <button
                                  onClick={handleRemoveSignatureImage}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submit Button */}
                        {isSignatureComplete && (
                          <button
                            onClick={handleSubmitSignature}
                            disabled={isSubmittingSignature}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingSignature ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting Signature...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Signature
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Other Signers */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  All Signers
                </h3>

                <div className="space-y-2">
                  {/* Publisher */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Publisher
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {documentData.publisherAddress.slice(0, 10)}...
                        {documentData.publisherAddress.slice(-8)}
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
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        currentAccount &&
                        signer.address.toLowerCase() ===
                          currentAccount.address.toLowerCase()
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {signer.name || "Unknown"}
                          {currentAccount &&
                            signer.address.toLowerCase() ===
                              currentAccount.address.toLowerCase() && (
                              <span className="text-blue-600 text-xs ml-2">
                                (You)
                              </span>
                            )}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {signer.address.slice(0, 10)}...
                          {signer.address.slice(-8)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          signer.hasSigned
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {signer.hasSigned ? "✓ Signed" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
