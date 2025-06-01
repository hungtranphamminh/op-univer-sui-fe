"use client";

/* eslint-disable  @typescript-eslint/no-explicit-any */

import React, { useState, useCallback, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import PdfUpload from "./pdf-upload";
import OwnSignature from "./own-signature";
import OtherSigners from "./other-signers";
import Sidebar from "./side-bar";
import Overlay from "./overlay";
import { API_BASE_URL } from "@/utils/const";

interface Signer {
  id: string;
  address: string;
  email?: string;
  name?: string;
}

const PublishRequestPage: React.FC = () => {
  const router = useRouter();

  // PDF Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature Options State
  const [addOwnSignature, setAddOwnSignature] = useState(false);
  const [addOtherSigners, setAddOtherSigners] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [newSignerAddress, setNewSignerAddress] = useState("");
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerEmail, setNewSignerEmail] = useState("");

  // Sui Wallet Integration
  const currentAccount = useCurrentAccount();

  // Own Signature State
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
    null
  );

  const [requestStatus, setRequestStatus] = useState<
    "none" | "loading" | "fail" | "success"
  >("none");

  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Document Info State
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");

  const maxFileSize = 10; // MB

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please select a PDF file only.";
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB.`;
    }
    return null;
  };

  const validateFileAndShowError = (file: File): boolean => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError(null);
    return true;
  };

  const validateSigner = (
    address: string,
    name?: string,
    email?: string
  ): string | null => {
    // Validate wallet address format (basic Sui address validation)
    if (!address || address.trim().length === 0) {
      return "Wallet address is required";
    }

    const trimmedAddress = address.trim();

    // Check if it looks like a valid Sui address (starts with 0x and has the right length)
    if (!trimmedAddress.startsWith("0x")) {
      return "Wallet address must start with '0x'";
    }

    if (trimmedAddress.length < 40 || trimmedAddress.length > 66) {
      return "Invalid wallet address length";
    }

    // Check for duplicate addresses
    const existingSigner = signers.find(
      (signer) => signer.address.toLowerCase() === trimmedAddress.toLowerCase()
    );

    if (existingSigner) {
      return "This wallet address is already added";
    }

    // Check if it's the same as publisher address
    if (
      currentAccount &&
      trimmedAddress.toLowerCase() === currentAccount.address.toLowerCase()
    ) {
      return "Cannot add your own wallet address as a signer";
    }

    // Validate email if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address";
      }
    }

    return null; // No errors
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);
      setIsLoading(true);

      if (!validateFileAndShowError(file)) {
        setIsLoading(false);
        return;
      }

      try {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }

        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        setSelectedFile(file);

        // Generate unique document ID when file is selected
        const newDocumentId = uuidv4();
        setDocumentId(newDocumentId);

        console.log("📄 PDF file selected:", {
          name: file.name,
          size: file.size,
          type: file.type,
          documentId: newDocumentId,
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF file.");
        setIsLoading(false);
      }
    },
    [pdfUrl]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    if (signatureImageUrl) {
      URL.revokeObjectURL(signatureImageUrl);
    }

    setPdfUrl(null);
    setSelectedFile(null);
    setError(null);
    setDocumentId(null);
    setSignatureMessage(null);
    setSignedMessage(null);
    setSignatureImage(null);
    setSignatureImageUrl(null);
    setAddOwnSignature(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  }, [pdfUrl, signatureImageUrl]);

  const addSigner = () => {
    if (!newSignerAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    // Validate the signer data
    const validationError = validateSigner(
      newSignerAddress,
      newSignerName,
      newSignerEmail
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const newSigner: Signer = {
      id: Date.now().toString(),
      address: newSignerAddress.trim(),
      name: newSignerName.trim() || undefined,
      email: newSignerEmail.trim() || undefined,
    };

    setSigners([...signers, newSigner]);
    setNewSignerAddress("");
    setNewSignerName("");
    setNewSignerEmail("");
    setError(null); // Clear any errors

    console.log("➕ Added new signer:", newSigner);
  };

  const removeSigner = (id: string) => {
    const signerToRemove = signers.find((s) => s.id === id);
    setSigners(signers.filter((signer) => signer.id !== id));
    setError(null); // Clear any errors

    if (signerToRemove) {
      console.log("➖ Removed signer:", signerToRemove.address);
    }
  };

  // Handle own signature checkbox
  const handleOwnSignatureChange = async (checked: boolean) => {
    setAddOwnSignature(checked);

    if (checked && currentAccount && documentId) {
      // Generate signature message
      const message = `I agree to sign the PDF document with ID: ${documentId}`;
      setSignatureMessage(message);
    } else {
      setSignatureMessage(null);
      setSignedMessage(null);
      if (signatureImageUrl) {
        URL.revokeObjectURL(signatureImageUrl);
      }
      setSignatureImage(null);
      setSignatureImageUrl(null);
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
      // 5MB limit
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
      console.log(err);
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

  // Fixed handleRequestPublish function for your PublishRequestPage

  const handleRequestPublish = async () => {
    setRequestStatus("loading");
    setError(null); // Clear any previous errors

    // Validation checks
    if (!selectedFile || !documentTitle.trim() || !documentId) {
      setError("Please provide a document and title before publishing.");
      setRequestStatus("fail");
      return;
    }

    if (!currentAccount) {
      setError("Please connect your wallet first.");
      setRequestStatus("fail");
      return;
    }

    // Check if at least one signature option is selected
    if (!addOwnSignature && signers.length === 0) {
      setError("Please add your signature or other signers before publishing.");
      setRequestStatus("fail");
      return;
    }

    if (addOwnSignature && (!signedMessage || !signatureImage)) {
      setError(
        "Please complete your signature (sign message and upload signature image) before publishing."
      );
      setRequestStatus("fail");
      return;
    }

    try {
      console.log("🚀 Starting document upload...");

      // Create FormData
      const formData = new FormData();

      // Add the PDF file
      formData.append("files", selectedFile);
      console.log("📎 Added PDF file:", selectedFile.name);

      // Add signature image if publisher is signing
      if (addOwnSignature && signatureImage) {
        formData.append("signatureImage", signatureImage);
        console.log("🖼️ Added signature image:", signatureImage.name);
      }

      // Add document data - each field individually
      formData.append("documentId", documentId);
      formData.append("title", documentTitle.trim());
      formData.append("publisherAddress", currentAccount.address);

      if (documentDescription && documentDescription.trim()) {
        formData.append("description", documentDescription.trim());
      }

      if (addOwnSignature && signedMessage) {
        formData.append("publisherSignature", signedMessage);
      }

      // Add signers as a properly formatted JSON string
      if (signers.length > 0) {
        const signersData = signers.map((signer) => ({
          address: signer.address.trim(),
          name: signer.name?.trim() || undefined,
          email: signer.email?.trim() || undefined,
        }));

        console.log("👥 Adding signers:", signersData);
        formData.append("signers", JSON.stringify(signersData));
      }

      // Log FormData contents for debugging
      console.log("📋 FormData contents:");
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
          );
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Make the API call
      console.log("🌐 Making API request...");
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }));
        console.error("❌ API Error:", errorData);
        throw new Error(
          errorData.message || `Server error: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("✅ Document uploaded successfully:", result);

      // Show success message
      setRequestStatus("success");

      // Navigate to the approval page
      setTimeout(() => {
        router.push(`/app/approved-publish?documentId=${documentId}`);
      }, 2000); // Give user time to see success message
    } catch (error) {
      console.error("❌ Failed to upload document:", error);

      // Set user-friendly error message
      if (error instanceof Error) {
        setError(`Upload failed: ${error.message}`);
      } else {
        setError(
          "Failed to upload document. Please check your connection and try again."
        );
      }

      setRequestStatus("fail");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Request loading overlay */}
      <Overlay requestStatus={requestStatus} />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Publish Document
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload your document, configure signatures, and publish to the
              blockchain
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* PDF Upload Section */}
            <PdfUpload
              selectedFile={selectedFile}
              handleFileSelect={handleFileSelect}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              fileInputRef={fileInputRef}
              handleFileInputChange={handleFileInputChange}
              handleRemoveFile={handleRemoveFile}
              pdfUrl={pdfUrl}
              isLoading={isLoading}
              error={error}
            />

            {/* Signature Options */}
            {selectedFile && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Signature Configuration
                </h2>

                <div className="space-y-4">
                  {/* Own Signature Checkbox */}
                  <div className="flex items-start space-x-3">
                    <input
                      id="own-signature"
                      type="checkbox"
                      checked={addOwnSignature}
                      onChange={(e) =>
                        handleOwnSignatureChange(e.target.checked)
                      }
                      disabled={!currentAccount || !documentId}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="own-signature"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Add My Signature
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentAccount
                          ? "Sign this document with your connected wallet"
                          : "Please connect your wallet first"}
                      </p>
                      {documentId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Document ID: {documentId.slice(0, 8)}...
                          {documentId.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Own Signature Section */}
                  <OwnSignature
                    addOwnSignature={addOwnSignature}
                    signatureMessage={signatureMessage}
                    signedMessage={signedMessage}
                    isSigningMessage={isSigningMessage}
                    // handleSignMessage={handleSignMessage}
                    setIsSigningMessage={setIsSigningMessage}
                    setSignedMessage={setSignedMessage}
                    setError={setError}
                    signatureImage={signatureImage}
                    signatureImageUrl={signatureImageUrl}
                    handleSignatureImageChange={handleSignatureImageChange}
                    handleRemoveSignatureImage={handleRemoveSignatureImage}
                    signatureInputRef={signatureInputRef}
                  />

                  {/* Other Signers Checkbox */}
                  <div className="flex items-start space-x-3">
                    <input
                      id="other-signers"
                      type="checkbox"
                      checked={addOtherSigners}
                      onChange={(e) => setAddOtherSigners(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="other-signers"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Add Other Signers
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Invite others to sign this document
                      </p>
                    </div>
                  </div>

                  {/* Other Signers Section */}
                  <OtherSigners
                    addOtherSigners={addOtherSigners}
                    signers={signers}
                    setNewSignerAddress={setNewSignerAddress}
                    newSignerAddress={newSignerAddress}
                    setNewSignerName={setNewSignerName}
                    newSignerName={newSignerName}
                    setNewSignerEmail={setNewSignerEmail}
                    newSignerEmail={newSignerEmail}
                    addSigner={addSigner}
                    removeSigner={removeSigner}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar
            documentTitle={documentTitle}
            setDocumentTitle={setDocumentTitle}
            documentDescription={documentDescription}
            signedMessage={signedMessage}
            signatureImage={signatureImage}
            setDocumentDescription={setDocumentDescription}
            handleRequestPublish={handleRequestPublish}
            selectedFile={selectedFile}
            addOwnSignature={addOwnSignature}
            signers={signers}
          />
        </div>
      </div>
    </div>
  );
};

export default PublishRequestPage;
