"use client";

import React, { useState, useCallback, useRef } from "react";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";
import { v4 as uuidv4 } from "uuid";
import PdfUpload from "./pdf-upload";
import OwnSignature from "./own-signature";
import OtherSigners from "./other-signers";
import Sidebar from "./side-bar";

interface Signer {
  id: string;
  address: string;
  email?: string;
  name?: string;
}

const PublishRequestPage: React.FC = () => {
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
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // Own Signature State
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
    null
  );
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

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);
      setIsLoading(true);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
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

        setIsLoading(false);
      } catch (err) {
        setError("Failed to load PDF file.");
        setIsLoading(false);
      }
    },
    [pdfUrl]
  );

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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
    if (!newSignerAddress.trim()) return;

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
  };

  const removeSigner = (id: string) => {
    setSigners(signers.filter((signer) => signer.id !== id));
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

  // Sign the message with wallet
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

  const handlePublish = async () => {
    if (!selectedFile || !documentTitle.trim() || !documentId) {
      setError("Please provide a document and title before publishing.");
      return;
    }

    if (addOwnSignature && (!signedMessage || !signatureImage)) {
      setError(
        "Please complete your signature (sign message and upload signature image) before publishing."
      );
      return;
    }

    try {
      if (!currentAccount) throw new Error("No wallet connected");

      // Create FormData
      const formData = new FormData();

      // Add the PDF file
      formData.append("files", selectedFile);

      // Add signature image if publisher is signing
      if (addOwnSignature && signatureImage) {
        formData.append("files", signatureImage, "signatureImage");
      }

      // Add document data
      formData.append("documentId", documentId);
      formData.append("title", documentTitle);
      formData.append("publisherAddress", currentAccount.address);

      if (documentDescription) {
        formData.append("description", documentDescription);
      }

      if (addOwnSignature && signedMessage) {
        formData.append("publisherSignature", signedMessage);
      }

      // Add signers as JSON string
      if (signers.length > 0) {
        formData.append(
          "signers",
          JSON.stringify(
            signers.map((signer) => ({
              address: signer.address,
              name: signer.name,
              email: signer.email,
            }))
          )
        );
      }

      // Make the API call
      const response = await fetch("http://localhost:3001/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Document uploaded successfully:", result);

      // Show success message
      alert("Document uploaded successfully to database!");

      // Here you can add any success handling like:
      // - Reset the form
      // - Redirect to another page
      // - Show the document status
      // - etc.
    } catch (error) {
      console.error("Failed to upload document:", error);
      setError("Failed to upload document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                    signatureMessage={signatureMessage ?? undefined}
                    signedMessage={signedMessage ?? undefined}
                    isSigningMessage={isSigningMessage}
                    handleSignMessage={handleSignMessage}
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
            setDocumentDescription={setDocumentDescription}
            handlePublish={handlePublish}
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
