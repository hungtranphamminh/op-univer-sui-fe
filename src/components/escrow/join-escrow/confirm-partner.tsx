import React, { useState } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { Loader, PenTool, Upload, FileText } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function EscrowConfirmPartnerSigning({
  documentId,
}: {
  readonly documentId: string;
}) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // State
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signedMessage, setSignedMessage] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle signature image upload
  const handleSignatureUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSignatureImage(file);
        setError(null);
      } else {
        setError("Please upload an image file for your signature");
      }
    }
  };

  // Sign message with wallet
  const handleWalletSign = async () => {
    if (!currentAccount) return;

    try {
      const message = `I agree to the terms of escrow contract ${documentId}`;
      const result = await signPersonalMessage({
        message: new TextEncoder().encode(message),
      });
      setSignedMessage(result.signature);
      setError(null);
    } catch (error) {
      console.error("Failed to sign message:", error);
      setError("Failed to sign with wallet");
    }
  };

  // Submit signature to backend
  const submitSignature = async () => {
    if (!currentAccount || !signedMessage || !signatureImage) return;

    setIsSigning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("signatureImage", signatureImage);
      formData.append("signerAddress", currentAccount.address);
      formData.append("signature", signedMessage);

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/sign-escrow`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit signature");
      }

      const result = await response.json();
    } catch (error) {
      console.error("Failed to submit signature:", error);
      setError("Failed to submit signature");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <PenTool className="w-5 h-5 mr-2 text-blue-600" />
        Sign Escrow Contract
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Step 1: Wallet Signature */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            1. Sign with Wallet
          </h4>
          {!signedMessage ? (
            <button
              onClick={handleWalletSign}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Sign Agreement
            </button>
          ) : (
            <div className="flex items-center text-sm text-green-600">
              <span>✓ Wallet signature completed</span>
            </div>
          )}
        </div>

        {/* Step 2: Upload Signature Image */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            2. Upload Signature Image
          </h4>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {signatureImage && (
              <div className="flex items-center text-sm text-green-600">
                <span>✓ Signature image uploaded: {signatureImage.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={submitSignature}
          disabled={!signedMessage || !signatureImage || isSigning}
          className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isSigning ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Submitting Signature...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Signature
            </>
          )}
        </button>
      </div>
    </div>
  );
}
