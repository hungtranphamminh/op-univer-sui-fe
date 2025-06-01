"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  PenTool,
  Send,
  Check,
  Image,
  DollarSign,
  Shield,
  CheckCircle,
  ExternalLink,
  Info,
  AlertTriangle,
  Users,
  UserPlus,
  Share2,
  Copy,
  Globe,
  Lock,
} from "lucide-react";
import {
  useSignPersonalMessage,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { v4 as uuidv4 } from "uuid";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

interface EscrowStatus {
  documentId: string;
  title: string;
  description?: string;
  documentStatus: string;
  documentType: "escrow_contract" | "open_escrow"; // Added documentType
  escrowStatus: string;
  escrowContractId?: string;
  partyA: string;
  partyB?: string;
  agreedAmount: number;
  partyASigned: boolean;
  partyBSigned: boolean;
  blockchainTxHash?: string;
  createdAt: string;

  // Open escrow specific fields
  isOpen?: boolean;
  shareToken?: string;
  shareUrl?: string;
  joinRequestCount?: number;
  category?: string;
  tags?: string[];
  deadline?: string;
  requirements?: string;

  // Work progress fields
  workSubmitted?: boolean;
  workConfirmed?: boolean;
  paymentConfirmed?: boolean;
  workSubmissionDate?: string;
  workConfirmationDate?: string;
  paymentReleaseDate?: string;
}

export default function CreateEscrowContract() {
  // Escrow type selection
  const [escrowType, setEscrowType] = useState<"closed" | "open">("closed");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Escrow contract state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [agreedAmount, setAgreedAmount] = useState<number>(0);

  // Closed escrow specific
  const [partyBAddress, setPartyBAddress] = useState("");
  const [partyBName, setPartyBName] = useState("");

  // Open escrow specific
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");

  // Signature state
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState<string | null>(
    null
  );
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Escrow management state
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus | null>(null);
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Wallet integration
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

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

        // Generate unique document ID
        const newDocumentId = uuidv4();
        setDocumentId(newDocumentId);
        setCurrentStep(2);

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

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Generate signature message
  const generateSignatureMessage = useCallback(() => {
    if (!documentId || !currentAccount) return;

    let message = "";
    if (escrowType === "closed") {
      message = `I, Party A (Client), agree to the escrow contract terms with document ID: ${documentId}. I will pay ${agreedAmount} SUI upon work completion confirmation. Service Provider: ${partyBAddress}`;
    } else {
      message = `I, Party A (Client), agree to create an open escrow contract with document ID: ${documentId}. I will pay ${agreedAmount} SUI upon work completion confirmation by the selected service provider.`;
    }
    setSignatureMessage(message);
  }, [documentId, currentAccount, agreedAmount, partyBAddress, escrowType]);

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
      setCurrentStep(4);
    } catch (err) {
      setError("Failed to load signature image.");
    }
  };

  // Create escrow contract
  const handleCreateEscrowContract = async () => {
    if (
      !selectedFile ||
      !documentTitle.trim() ||
      !documentId ||
      !agreedAmount
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (escrowType === "closed" && !partyBAddress.trim()) {
      setError("Please provide the service provider's wallet address.");
      return;
    }

    if (!currentAccount) {
      setError("Please connect your wallet.");
      return;
    }

    if (!signedMessage || !signatureImage) {
      setError("Please complete your signature first.");
      return;
    }

    setIsCreatingEscrow(true);
    setError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("files", selectedFile);
      formData.append("signatureImage", signatureImage);
      formData.append("documentId", documentId);
      formData.append("title", documentTitle);
      formData.append("description", documentDescription);
      formData.append("publisherAddress", currentAccount.address);
      formData.append("publisherSignature", signedMessage);
      formData.append("agreedAmount", agreedAmount.toString());

      let endpoint = "";

      if (escrowType === "closed") {
        // Closed escrow
        formData.append("partyB", partyBAddress);
        endpoint = "http://localhost:3001/documents/escrow/create";
      } else {
        // Open escrow
        if (category) formData.append("category", category);
        if (tags.length > 0) formData.append("tags", tags.join(","));
        if (deadline) formData.append("deadline", deadline);
        if (requirements) formData.append("requirements", requirements);
        endpoint = "http://localhost:3001/documents/escrow/create-open";
      }

      // Create escrow contract
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create escrow contract");
      }

      const result = await response.json();
      console.log("✅ Escrow contract created:", result);

      // Load the created escrow status
      await loadEscrowStatus(documentId);
      setCurrentStep(5);
    } catch (err: any) {
      console.error("❌ Failed to create escrow contract:", err);
      setError(err.message || "Failed to create escrow contract");
    } finally {
      setIsCreatingEscrow(false);
    }
  };

  // Load escrow status
  const loadEscrowStatus = async (docId: string) => {
    try {
      console.log(`📡 Loading escrow status for document: ${docId}`);

      const response = await fetch(
        `http://localhost:3001/documents/${docId}/escrow-status`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch escrow status");
      }

      const result = await response.json();
      console.log("✅ Escrow status loaded:", result.data);

      setEscrowStatus(result.data);
    } catch (err: any) {
      console.error("❌ Failed to load escrow status:", err);
      setError(err.message || "Failed to load escrow status");
    }
  };

  // Copy share link
  const copyShareLink = () => {
    if (escrowStatus?.shareUrl) {
      navigator.clipboard.writeText(escrowStatus.shareUrl);
      // You could add a toast notification here
    }
  };

  // Auto-generate signature message when dependencies change
  useEffect(() => {
    if (documentId && currentAccount && agreedAmount > 0) {
      if (escrowType === "closed" && partyBAddress) {
        generateSignatureMessage();
        if (documentTitle && agreedAmount && partyBAddress) {
          setCurrentStep(3);
        }
      } else if (escrowType === "open") {
        generateSignatureMessage();
        if (documentTitle && agreedAmount) {
          setCurrentStep(3);
        }
      }
    }
  }, [
    documentId,
    currentAccount,
    agreedAmount,
    partyBAddress,
    documentTitle,
    escrowType,
    generateSignatureMessage,
  ]);

  const canCreateContract =
    selectedFile &&
    documentTitle.trim() &&
    agreedAmount > 0 &&
    signedMessage &&
    signatureImage &&
    (escrowType === "open" ||
      (escrowType === "closed" && partyBAddress.trim()));

  const steps = [
    {
      number: 1,
      title: "Upload Contract",
      description: "Upload PDF document",
      completed: !!selectedFile,
    },
    {
      number: 2,
      title: "Contract Details",
      description: "Set title, amount, parties",
      completed: !!(
        documentTitle &&
        agreedAmount &&
        (escrowType === "open" || partyBAddress)
      ),
    },
    {
      number: 3,
      title: "Sign Agreement",
      description: "Digital signature",
      completed: !!(signedMessage && signatureImage),
    },
    {
      number: 4,
      title: "Create Document",
      description: "Generate signed PDF",
      completed: !!escrowStatus,
    },
    {
      number: 5,
      title:
        escrowType === "open" ? "Share & Find Partner" : "Deploy to Blockchain",
      description:
        escrowType === "open" ? "Share link to find partner" : "Publish on Sui",
      completed:
        escrowType === "open"
          ? !!escrowStatus?.shareUrl
          : !!escrowStatus?.blockchainTxHash,
    },
    {
      number: 6,
      title: "Ready for Use",
      description:
        escrowType === "open" ? "Wait for partner" : "Share with Party B",
      completed:
        escrowType === "open"
          ? !!escrowStatus?.partyB
          : !!escrowStatus?.escrowContractId,
    },
  ];

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
                  Create Escrow Contract
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Create a payment-protected contract with built-in escrow
                  system
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Escrow Type Selection */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Choose Escrow Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Closed Escrow */}
            <div
              onClick={() => setEscrowType("closed")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                escrowType === "closed"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    escrowType === "closed" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Lock
                    className={`w-5 h-5 ${
                      escrowType === "closed"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Closed Escrow</h3>
                  <p className="text-sm text-gray-600">
                    Work with known partner
                  </p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You know the service provider</li>
                <li>• Direct contract between two parties</li>
                <li>• Immediate blockchain deployment</li>
                <li>• Traditional escrow workflow</li>
              </ul>
            </div>

            {/* Open Escrow */}
            <div
              onClick={() => setEscrowType("open")}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                escrowType === "open"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    escrowType === "open" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <Globe
                    className={`w-5 h-5 ${
                      escrowType === "open" ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Open Escrow</h3>
                  <p className="text-sm text-gray-600">Find partner later</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Find service provider later</li>
                <li>• Shareable public link</li>
                <li>• Social media marketing</li>
                <li>• Partner selection process</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Creation Progress
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

        {/* Show escrow status if created */}
        {escrowStatus && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {escrowType === "open"
                  ? "Open Escrow Contract Status"
                  : "Escrow Contract Status"}
              </h2>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  escrowStatus.escrowStatus === "completed"
                    ? "bg-green-100 text-green-800"
                    : escrowStatus.escrowStatus === "open" ||
                      escrowStatus.escrowStatus === "partnered"
                    ? "bg-blue-100 text-blue-800"
                    : escrowStatus.escrowStatus === "signed"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {escrowStatus.escrowStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Contract Amount
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {escrowStatus.agreedAmount} SUI
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Party A (Client)
                </h3>
                <p className="text-xs font-mono text-gray-700">
                  {escrowStatus.partyA}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  {escrowType === "open"
                    ? "Partner Status"
                    : "Party B (Provider)"}
                </h3>
                {escrowType === "open" ? (
                  <p className="text-sm text-gray-700">
                    {escrowStatus.partyB ? (
                      <span className="text-green-600">✓ Partner Found</span>
                    ) : (
                      <span className="text-amber-600">
                        ⏳ Looking for Partner
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-gray-700">
                    {escrowStatus.partyB}
                  </p>
                )}
              </div>
            </div>

            {/* Open Escrow Specific Info */}
            {escrowType === "open" && escrowStatus.shareUrl && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🔗 Share Your Open Escrow
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  Share this link to find service providers for your project
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={escrowStatus.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-blue-300 rounded-md"
                  />
                  <button
                    onClick={copyShareLink}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                </div>
                {escrowStatus.joinRequestCount !== undefined && (
                  <p className="text-xs text-blue-600 mt-2">
                    📬 {escrowStatus.joinRequestCount} join request(s) received
                  </p>
                )}
              </div>
            )}

            {/* Action buttons and blockchain info would go here */}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: PDF Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Step 1: Upload Contract Document
                </h2>
                {selectedFile && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>

              {!selectedFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400 bg-white"
                  }`}
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
                    <div className="p-4 bg-blue-50 rounded-full">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upload Contract PDF
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload the contract PDF that will define the work terms
                        and conditions
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Contract PDF
                      </button>
                    </div>

                    <p className="text-xs text-gray-400">
                      Maximum file size: {maxFileSize}MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-900">
                            {selectedFile.name}
                          </h4>
                          <p className="text-xs text-green-700">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •
                            PDF Contract
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPdfUrl(null);
                          setCurrentStep(1);
                        }}
                        className="p-2 text-green-400 hover:text-red-600 transition-colors"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {pdfUrl && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Contract Preview
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <iframe
                          src={pdfUrl}
                          className="w-full h-64 border border-gray-200 rounded"
                          title="Contract Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Contract Details */}
            {selectedFile && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Step 2: Contract Details
                  </h2>
                  {documentTitle &&
                    agreedAmount &&
                    (escrowType === "open" || partyBAddress) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Title *
                    </label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="Web Development Services Contract"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Description
                    </label>
                    <textarea
                      value={documentDescription}
                      onChange={(e) => setDocumentDescription(e.target.value)}
                      rows={3}
                      placeholder="Detailed description of the work to be performed, deliverables, timeline, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Amount (SUI) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={agreedAmount || ""}
                        onChange={(e) =>
                          setAgreedAmount(parseFloat(e.target.value) || 0)
                        }
                        placeholder="10.5"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This amount will be held in escrow until work completion
                      is confirmed
                    </p>
                  </div>

                  {/* Closed Escrow Specific Fields */}
                  {escrowType === "closed" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Provider Wallet Address *
                        </label>
                        <input
                          type="text"
                          value={partyBAddress}
                          onChange={(e) => setPartyBAddress(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The wallet address of the person who will complete the
                          work
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Provider Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={partyBName}
                          onChange={(e) => setPartyBName(e.target.value)}
                          placeholder="John Developer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Open Escrow Specific Fields */}
                  {escrowType === "open" && (
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Open Escrow Details
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select category</option>
                            <option value="web-dev">Web Development</option>
                            <option value="mobile-dev">
                              Mobile Development
                            </option>
                            <option value="design">Design & UI/UX</option>
                            <option value="marketing">Digital Marketing</option>
                            <option value="writing">Content Writing</option>
                            <option value="consulting">Consulting</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deadline (Optional)
                          </label>
                          <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skills/Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="e.g., React, TypeScript, responsive"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onKeyPress={(e) => e.key === "Enter" && addTag()}
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                          >
                            Add
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Add skills/technologies needed for this project
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Detailed Requirements
                        </label>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          rows={3}
                          placeholder="Specific requirements, qualifications, portfolio examples needed..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Help potential partners understand what you're looking
                          for
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Signature Section */}
            {selectedFile &&
              documentTitle &&
              agreedAmount > 0 &&
              (escrowType === "open" ||
                (escrowType === "closed" && partyBAddress)) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Step 3: Your Digital Signature (Party A - Client)
                    </h2>
                    {signedMessage && signatureImage && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Step 3a: Sign Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Step 3a: Sign Agreement Message
                        </h4>
                        {signedMessage && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Signed</span>
                          </div>
                        )}
                      </div>

                      {signatureMessage && (
                        <div className="bg-white p-3 rounded border text-sm text-gray-700 mb-3 max-h-20 overflow-y-auto">
                          {signatureMessage}
                        </div>
                      )}

                      {!signedMessage ? (
                        <button
                          onClick={handleSignMessage}
                          disabled={
                            isSigningMessage ||
                            !currentAccount ||
                            !signatureMessage
                          }
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ✓ Agreement message signed successfully with your
                          wallet
                        </div>
                      )}
                    </div>

                    {/* Step 3b: Upload Signature Image */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Step 3b: Upload Signature Image
                        </h4>
                        {signatureImage && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-xs">Uploaded</span>
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
                            onClick={() => signatureInputRef.current?.click()}
                            disabled={!signedMessage}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Image className="w-4 h-4 mr-2" />
                            Choose Signature Image
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, or other image formats. Max 5MB.
                          </p>
                          {!signedMessage && (
                            <p className="text-xs text-amber-600 mt-1">
                              Please sign the agreement message first
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 p-3 bg-white rounded border">
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
                              onClick={() => {
                                if (signatureImageUrl)
                                  URL.revokeObjectURL(signatureImageUrl);
                                setSignatureImage(null);
                                setSignatureImageUrl(null);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                            ✓ Signature image uploaded successfully
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Completion Status */}
                    {signedMessage && signatureImage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Your signature is complete!
                          </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Both wallet signature and image have been completed.
                          Ready to create contract.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contract Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {escrowType} Escrow
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Document:</span>
                  <span className="text-gray-900 font-medium">
                    {selectedFile
                      ? selectedFile.name.length > 15
                        ? selectedFile.name.slice(0, 15) + "..."
                        : selectedFile.name
                      : "None"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Contract Amount:</span>
                  <span className="text-gray-900 font-medium">
                    {agreedAmount > 0 ? `${agreedAmount} SUI` : "Not set"}
                  </span>
                </div>

                {escrowType === "closed" ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Provider:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {partyBAddress
                        ? `${partyBAddress.slice(0, 6)}...${partyBAddress.slice(
                            -4
                          )}`
                        : "Not set"}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="text-gray-900">
                        {category || "Not set"}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tags:</span>
                        <span className="text-gray-900">
                          {tags.length} tag{tags.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Your Signature:</span>
                  <span className="text-gray-900">
                    {signedMessage && signatureImage ? (
                      <span className="text-green-600">✓ Complete</span>
                    ) : (
                      <span className="text-yellow-600">Incomplete</span>
                    )}
                  </span>
                </div>

                {currentAccount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Address:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {`${currentAccount.address.slice(
                        0,
                        6
                      )}...${currentAccount.address.slice(-4)}`}
                    </span>
                  </div>
                )}

                {documentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document ID:</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {`${documentId.slice(0, 8)}...`}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCreateEscrowContract}
                  // disabled={!canCreateContract || isCreatingEscrow}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingEscrow ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Contract...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create {escrowType === "open" ? "Open" : ""} Escrow
                      Contract
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  {escrowType === "open"
                    ? "This creates a shareable contract link"
                    : "This creates the signed PDF. Blockchain deployment is the next step."}
                </p>
              </div>
            </div>

            {/* How Escrow Works - Different content based on type */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">
                How {escrowType === "open" ? "Open" : "Closed"} Escrow Works
              </h3>

              {escrowType === "closed" ? (
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Create & Sign Contract</p>
                      <p className="text-blue-600">
                        Both parties digitally sign the PDF document
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Deploy to Blockchain</p>
                      <p className="text-blue-600">
                        Contract published to Sui for transparency
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Fund Escrow</p>
                      <p className="text-blue-600">
                        Client deposits payment to smart contract
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Complete & Release</p>
                      <p className="text-blue-600">
                        Work completion confirmed, payment released
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Create Open Contract</p>
                      <p className="text-blue-600">
                        Define work requirements and payment amount
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Share & Market</p>
                      <p className="text-blue-600">
                        Share link on social media to find providers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Review Applications</p>
                      <p className="text-blue-600">
                        Service providers request to join your contract
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Select & Deploy</p>
                      <p className="text-blue-600">
                        Choose partner, both sign, deploy to blockchain
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {escrowType === "open"
                      ? "Social Discovery"
                      : "Protected Payments"}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {escrowType === "open"
                    ? "Leverage existing social networks to find the right service provider"
                    : "Funds are held safely in a smart contract until both parties confirm completion"}
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
                    {escrowType === "open"
                      ? "Anyone with the link can request to join your escrow contract"
                      : "Both parties must have Sui wallets to participate in the escrow system"}
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    {escrowType === "open"
                      ? "You can review and select from multiple service provider applications"
                      : "All transactions on the blockchain require small gas fees (typically ~0.003 SUI)"}
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    {escrowType === "open"
                      ? "Once you accept a partner, the contract becomes closed and ready for blockchain deployment"
                      : "The service provider needs to sign the contract before it can be deployed to blockchain"}
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Once deployed, the contract terms cannot be changed - ensure
                    all details are correct
                  </p>
                </div>
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
                      {process.env.NEXT_PUBLIC_SUI_NETWORK || "devnet"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Connected Wallet
                  </span>
                  <span className="text-xs font-mono text-gray-900">
                    {currentAccount?.address ? (
                      `${currentAccount.address.slice(
                        0,
                        6
                      )}...${currentAccount.address.slice(-4)}`
                    ) : (
                      <span className="text-red-600">Not connected</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gas Price</span>
                  <span className="text-sm text-green-600">~0.003 SUI</span>
                </div>
              </div>

              {!currentAccount && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    Please connect your Sui wallet to create escrow contracts
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
