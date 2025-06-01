/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PenTool,
  FileText,
  Shield,
  Check,
  CheckCircle,
  X,
  AlertCircle,
  Image,
  Loader,
  ExternalLink,
  DollarSign,
  Clock,
  User,
  Info,
  AlertTriangle,
  Eye,
  Download,
  Wallet,
  Send,
  RefreshCw,
} from "lucide-react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { API_BASE_URL } from "@/utils/const";
import { useSearchParams } from "next/navigation";

// API Configuration

export default function EscrowPartnerSigning() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") ?? "";
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // State
  const [escrowData, setEscrowData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Signature state
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
    null
  );
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);

  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Load escrow data from backend
  useEffect(() => {
    const loadEscrowData = async () => {
      if (!documentId) return;

      setIsLoadingData(true);
      setError(null);

      try {
        console.log(`📡 Loading escrow data for document: ${documentId}`);

        const response = await fetch(
          `${API_BASE_URL}/documents/${documentId}/escrow-status`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch escrow data");
        }

        const result = await response.json();
        console.log("✅ Escrow data loaded:", result.data);

        setEscrowData(result.data);

        // Check if current user is authorized to sign
        if (currentAccount) {
          const authResponse = await fetch(
            `${API_BASE_URL}/documents/${documentId}/can-sign/${currentAccount.address}`
          );

          if (authResponse.ok) {
            const authResult = await authResponse.json();
            console.log("🔐 Authorization check:", authResult.data);

            if (!authResult.data.isAuthorized) {
              setError("You are not authorized to sign this contract.");
              return;
            }

            if (authResult.data.hasAlreadySigned) {
              setError("You have already signed this contract.");
              return;
            }

            if (!authResult.data.canSign) {
              setError(
                `Cannot sign contract. Status: ${authResult.data.documentStatus}`
              );
              return;
            }
          }
        }
      } catch (err: any) {
        console.error("❌ Failed to load escrow data:", err);
        setError(err.message || "Failed to load escrow data");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadEscrowData();
  }, [documentId, currentAccount]);

  // Generate signature message
  useEffect(() => {
    if (escrowData && currentAccount) {
      const message = `I, ${currentAccount.address}, agree to provide the services described in escrow contract "${escrowData.title}" (ID: ${escrowData.documentId}) for the agreed amount of ${escrowData.agreedAmount} SUI. I confirm that I understand the work requirements and will deliver as specified.`;
      setSignatureMessage(message);
    }
  }, [escrowData, currentAccount]);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Sign the message with wallet
  const handleSignMessage = async () => {
    if (!signatureMessage || !currentAccount) return;

    setIsSigningMessage(true);
    setError(null);

    try {
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(signatureMessage),
      });

      setSignedMessage(signature.signature);
      setCurrentStep(2);
      setSuccessMessage("Agreement message signed successfully!");
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
      setCurrentStep(3);
      setSuccessMessage("Signature image uploaded successfully!");
    } catch (err) {
      console.log(err);
      setError("Failed to load signature image.");
    }
  };

  // Submit signature to backend
  const handleSubmitSignature = async () => {
    if (!currentAccount || !signedMessage || !signatureImage) return;

    setIsSubmittingSignature(true);
    setError(null);

    try {
      console.log(`📤 Submitting signature for document: ${documentId}`);

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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit signature");
      }

      const result = await response.json();
      console.log("✅ Signature submitted successfully:", result);

      setCurrentStep(4);
      setSuccessMessage(
        "Contract signed successfully! The escrow is now ready for blockchain deployment."
      );

      // Reload escrow data to get updated status
      const updatedResponse = await fetch(
        `${API_BASE_URL}/documents/${documentId}/escrow-status`
      );
      if (updatedResponse.ok) {
        const updatedResult = await updatedResponse.json();
        setEscrowData(updatedResult.data);
      }
    } catch (err: any) {
      console.error("❌ Failed to submit signature:", err);
      setError(err.message || "Failed to submit signature");
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Review Contract",
      description: "Understand work requirements",
      completed: !!currentAccount,
    },
    {
      number: 2,
      title: "Sign Agreement",
      description: "Digital wallet signature",
      completed: !!signedMessage,
    },
    {
      number: 3,
      title: "Upload Signature",
      description: "Image signature",
      completed: !!signatureImage,
    },
    {
      number: 4,
      title: "Complete Signing",
      description: "Submit to contract",
      completed: currentStep >= 4,
    },
  ];

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your Sui wallet to sign this escrow contract as the
            service provider.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Make sure you&apos;re connecting the wallet address that was
              specified in the original contract.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading escrow contract...</p>
        </div>
      </div>
    );
  }

  if (error && !escrowData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Contract
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!escrowData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No escrow data found</p>
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
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Sign Escrow Contract
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Complete your signature to join this escrow agreement as the
                  service provider
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Signing Progress
          </h2>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : currentStep === step.number
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step.completed ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Contract Overview
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {escrowData.category || "General"}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {escrowData.agreedAmount} SUI
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {escrowData.title}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {escrowData.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Payment</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {escrowData.agreedAmount} SUI
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-600">Deadline</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {escrowData.deadline
                          ? new Date(escrowData.deadline).toLocaleDateString()
                          : "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Client</p>
                      <p className="text-xs font-mono text-gray-900">
                        {escrowData.partyA.slice(0, 6)}...
                        {escrowData.partyA.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                {escrowData.requirements && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Work Requirements
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {escrowData.requirements}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-3 border-t border-gray-200">
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Contract PDF
                  </button>
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    <Download className="w-4 h-4 mr-2" />
                    Download Contract
                  </button>
                </div>
              </div>
            </div>

            {/* Step 1: Wallet Signature */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Step 1: Sign Agreement Message
                </h2>
                {signedMessage && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {signatureMessage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Agreement Message
                  </h4>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {signatureMessage}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    This message will be cryptographically signed with your
                    wallet to confirm your agreement.
                  </p>
                </div>
              )}

              {!signedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Connected Wallet
                      </p>
                      <p className="text-xs font-mono text-gray-600">
                        {currentAccount?.address.slice(0, 6)}...
                        {currentAccount?.address.slice(-4)}{" "}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSignMessage}
                    disabled={
                      isSigningMessage || !currentAccount || !signatureMessage
                    }
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSigningMessage ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Signing with Wallet...
                      </>
                    ) : (
                      <>
                        <PenTool className="w-5 h-5 mr-2" />
                        Sign Agreement with Wallet
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    This creates a cryptographic signature proving your consent
                    to the contract terms
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Agreement Message Signed Successfully
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Your wallet signature has been recorded and verified
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Signature Image Upload */}
            {signedMessage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Step 2: Upload Your Signature Image
                  </h2>
                  {signatureImage && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {!signatureImage ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-amber-800">
                            Upload an image of your signature that will be added
                            to the contract PDF
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Accepted formats: PNG, JPG, GIF. Maximum size: 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureImageChange}
                      className="hidden"
                    />

                    <button
                      onClick={() => signatureInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Image className="w-5 h-5 mr-2" />
                      Choose Signature Image
                    </button>

                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Don&apos;t have a digital signature? You can create one
                        using online signature tools or take a photo of your
                        handwritten signature on white paper.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={signatureImageUrl!}
                          alt="Signature"
                          className="h-16 w-auto border rounded bg-white"
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
                          onClick={() => {
                            if (signatureImageUrl)
                              URL.revokeObjectURL(signatureImageUrl);
                            setSignatureImage(null);
                            setSignatureImageUrl(null);
                            setCurrentStep(2);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-green-900">
                          Signature image uploaded successfully
                        </p>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        This signature will be placed on the contract PDF when
                        you complete the signing process
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Final Submission */}
            {signedMessage && signatureImage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Step 3: Complete Contract Signing
                  </h2>
                  {currentStep >= 4 && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {currentStep < 4 ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          Ready to Submit
                        </span>
                      </div>
                      <p className="text-sm text-green-800">
                        Both your wallet signature and signature image are
                        ready. Click below to submit your signature to the
                        escrow contract.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Wallet signature completed</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Signature image uploaded</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Ready for final submission</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitSignature}
                      disabled={isSubmittingSignature}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmittingSignature ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Submitting Signature...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Submit Signature to Contract
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      This will add your signature to the contract and notify
                      the client that you&apos;ve signed
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="p-6">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Contract Signed Successfully! 🎉
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You have successfully signed the escrow contract. The
                        client will be notified and can now deploy the contract
                        to the blockchain.
                      </p>

                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            What&apos;s Next?
                          </h4>
                          <div className="text-sm text-blue-800 space-y-2">
                            <p>
                              1. Client will deploy the contract to Sui
                              blockchain
                            </p>
                            <p>
                              2. Client will fund the escrow with{" "}
                              {escrowData.agreedAmount} SUI
                            </p>
                            <p>3. You can begin work once escrow is funded</p>
                            <p>4. Submit your work when complete for review</p>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() =>
                              (window.location.href = "/dashboard")
                            }
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Go to Dashboard
                          </button>
                          <button
                            onClick={() =>
                              (window.location.href = `/app/escrow/workspace/${documentId}`)
                            }
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Workspace
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Role */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Your Role
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Service Provider
                    </p>
                    <p className="text-xs text-gray-600">
                      Party B in this escrow contract
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">
                    Your Wallet Address:
                  </p>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {currentAccount.address}
                  </p>
                </div>

                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Your Responsibilities:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Complete work as described in contract</li>
                    <li>• Meet the specified deadline</li>
                    <li>• Submit deliverables for client review</li>
                    <li>• Release payment after approval</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contract Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium px-2 py-1 rounded-full text-xs ${
                      escrowData.partyBSigned
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {escrowData.partyBSigned
                      ? "Signed by You"
                      : "Awaiting Your Signature"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-semibold text-green-600">
                    {escrowData.agreedAmount} SUI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">
                    {escrowData.category || "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="text-xs">
                    {escrowData.deadline
                      ? new Date(escrowData.deadline).toLocaleDateString()
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-xs">
                    {new Date(escrowData.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract ID:</span>
                  <span className="font-mono text-xs">
                    {typeof escrowData.documentId === "string" &&
                      escrowData.documentId.length > 0 &&
                      escrowData.documentId.slice(0, 8)}
                    ...
                  </span>
                </div>
              </div>
            </div>

            {/* Signing Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Progress Checklist
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      currentAccount ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {currentAccount && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm ${
                      currentAccount ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Wallet connected
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      signedMessage ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {signedMessage && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm ${
                      signedMessage ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Agreement signed
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      signatureImage ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {signatureImage && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={`text-sm ${
                      signatureImage ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Signature uploaded
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      currentStep >= 4 ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {currentStep >= 4 && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      currentStep >= 4 ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Signature submitted
                  </span>
                </div>
              </div>

              {currentStep >= 4 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      All steps completed!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* How Escrow Works */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                How Escrow Protects You
              </h3>

              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Payment Security</p>
                    <p className="text-blue-600">
                      Client funds escrow before work begins
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Work Protection</p>
                    <p className="text-blue-600">
                      Complete work at your own pace securely
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Guaranteed Payment</p>
                    <p className="text-blue-600">
                      Automatic release after approval
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Dispute Resolution</p>
                    <p className="text-blue-600">
                      Built-in protection for both parties
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Blockchain Security
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  All transactions are secured by Sui blockchain smart contracts
                </p>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
              <h3 className="text-lg font-medium text-amber-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Important Notes
              </h3>

              <div className="space-y-3 text-sm text-amber-800">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Your signature is legally binding and confirms your
                    agreement to complete the specified work
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Payment will be held securely in escrow until work is
                    completed and approved by the client
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    You will need to submit deliverables through the escrow
                    workspace when work is complete
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Make sure you understand all requirements before signing
                    this contract
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    window.open(
                      `${API_BASE_URL}/documents/${documentId}/pdf`,
                      "_blank"
                    )
                  }
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Contract
                </button>

                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `${API_BASE_URL}/documents/${documentId}/pdf`;
                    link.download = `${escrowData.title}.pdf`;
                    link.click();
                  }}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>

                <button
                  onClick={() =>
                    window.open(
                      `https://suiexplorer.com/address/${escrowData.partyA}?network=devnet`,
                      "_blank"
                    )
                  }
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Client on Explorer
                </button>

                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Network Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Network Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900 uppercase">
                      DEVNET
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Connected Wallet
                  </span>
                  <span className="text-xs font-mono text-gray-900">
                    {currentAccount?.address.slice(0, 6)}...
                    {currentAccount?.address.slice(-4)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contract Type</span>
                  <span className="text-sm text-blue-600">
                    Escrow Agreement
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gas Fee</span>
                  <span className="text-sm text-green-600">~0.003 SUI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
