import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Loader,
  DollarSign,
  Clock,
  User,
  MessageSquare,
  ExternalLink,
  Eye,
  Calendar,
  Package,
  Send,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shield,
  Activity,
  Wallet,
} from "lucide-react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Types
interface EscrowWorkspace {
  documentId: string;
  title: string;
  description: string;
  agreedAmount: number;
  partyA: string; // Client
  partyB: string; // Provider
  escrowStatus:
    | "signed"
    | "funded"
    | "work_submitted"
    | "work_confirmed"
    | "completed";
  escrowContractId?: string;
  deadline?: string;
  requirements?: string;

  // Work details
  workDescription?: string;
  workDeliveryNotes?: string;
  workSubmissionDate?: string;
  workConfirmationDate?: string;
  paymentReleaseDate?: string;

  // Transaction hashes
  fundingTxHash?: string;
  workSubmissionTxHash?: string;
  workConfirmationTxHash?: string;
  paymentReleaseTxHash?: string;
  blockchainTxHash?: string;
  suiObjectId?: string;
}

interface WorkSubmission {
  description: string;
  deliveryNotes: string;
  attachmentUrls: string[];
  completionNotes: string;
}

interface WorkReview {
  feedback: string;
  requestedChanges?: string;
}

interface EscrowWorkspaceProps {
  documentId: string;
}

export default function EscrowWorkspace({ documentId }: EscrowWorkspaceProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  // State
  const [escrow, setEscrow] = useState<EscrowWorkspace | null>(null);
  const [userRole, setUserRole] = useState<"client" | "provider" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Action states
  const [isFundingEscrow, setIsFundingEscrow] = useState(false);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isReviewingWork, setIsReviewingWork] = useState(false);
  const [isReleasingPayment, setIsReleasingPayment] = useState(false);

  // Form states
  const [workSubmission, setWorkSubmission] = useState<WorkSubmission>({
    description: "",
    deliveryNotes: "",
    attachmentUrls: [],
    completionNotes: "",
  });

  const [workReview, setWorkReview] = useState<WorkReview>({
    feedback: "",
    requestedChanges: "",
  });

  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");

  useEffect(() => {
    if (documentId) {
      loadEscrowData();
    }
  }, [documentId, currentAccount]);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadEscrowData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📡 Loading escrow data for ${documentId}...`);

      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/escrow-status`
      );

      if (!response.ok) {
        throw new Error("Failed to load escrow data");
      }

      const result = await response.json();
      setEscrow(result.data);

      // Determine user role
      if (currentAccount) {
        console.log("data.partyA:", result.data.partyA);
        if (result.data.partyA === currentAccount.address) {
          setUserRole("client");
        } else if (result.data.partyB === currentAccount.address) {
          setUserRole("provider");
        }
      }

      console.log("✅ Escrow data loaded:", result.data);
    } catch (error: any) {
      console.error("❌ Failed to load escrow data:", error);
      setError(error.message || "Failed to load escrow data");
    } finally {
      setIsLoading(false);
    }
  };

  // 💰 Fund the escrow (Client only)
  const fundEscrow = async () => {
    if (!escrow || !currentAccount || userRole !== "client") return;

    setIsFundingEscrow(true);
    setError(null);

    try {
      console.log(`💰 Funding escrow with ${escrow.agreedAmount} SUI...`);

      const transaction = new Transaction();
      const amountInMist = escrow.agreedAmount * 1000000000;

      // Create funding transaction (this is simplified - adjust based on your smart contract)
      transaction.moveCall({
        target: `${process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID}::escrow_contract::fund_escrow`,
        arguments: [
          transaction.object(escrow.escrowContractId!),
          transaction.splitCoins(transaction.gas, [amountInMist]),
          transaction.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecuteTransaction({ transaction });
      console.log("✅ Funding transaction completed:", result.digest);

      // Confirm funding with backend
      await fetch(`${API_BASE_URL}/documents/${documentId}/fund-escrow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionDigest: result.digest,
          amount: escrow.agreedAmount,
        }),
      });

      setSuccessMessage("Escrow funded successfully! Work can now begin.");
      await loadEscrowData();
    } catch (error: any) {
      console.error("❌ Failed to fund escrow:", error);
      setError(error.message || "Failed to fund escrow");
    } finally {
      setIsFundingEscrow(false);
    }
  };

  // 📤 Submit work (Provider only)
  const submitWork = async () => {
    if (!escrow || !currentAccount || userRole !== "provider") return;

    if (!workSubmission.description.trim()) {
      setError("Please provide a work description");
      return;
    }

    setIsSubmittingWork(true);
    setError(null);

    try {
      console.log(`📤 Submitting work for escrow ${documentId}...`);

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID}::escrow_contract::submit_work`,
        arguments: [
          transaction.object(escrow.escrowContractId!),
          transaction.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecuteTransaction({ transaction });
      console.log("✅ Work submission transaction completed:", result.digest);

      // Confirm with backend
      await fetch(`${API_BASE_URL}/documents/${documentId}/submit-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionDigest: result.digest,
          workDescription: workSubmission.description,
          deliveryNotes: workSubmission.deliveryNotes,
          attachmentUrls: workSubmission.attachmentUrls,
          completionNotes: workSubmission.completionNotes,
        }),
      });

      setWorkSubmission({
        description: "",
        deliveryNotes: "",
        attachmentUrls: [],
        completionNotes: "",
      });

      setSuccessMessage("Work submitted successfully! Awaiting client review.");
      await loadEscrowData();
    } catch (error: any) {
      console.error("❌ Failed to submit work:", error);
      setError(error.message || "Failed to submit work");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // ✅ Review work (Client only)
  const reviewWork = async (approve: boolean) => {
    if (!escrow || !currentAccount || userRole !== "client") return;

    if (!workReview.feedback.trim()) {
      setError("Please provide feedback for your decision");
      return;
    }

    setIsReviewingWork(true);
    setError(null);

    try {
      if (approve) {
        console.log(`✅ Approving work for escrow ${documentId}...`);

        const transaction = new Transaction();

        transaction.moveCall({
          target: `${process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID}::escrow_contract::confirm_work`,
          arguments: [
            transaction.object(escrow.escrowContractId!),
            transaction.object("0x6"), // Clock
          ],
        });

        const result = await signAndExecuteTransaction({ transaction });
        console.log("✅ Work approval transaction completed:", result.digest);

        await fetch(`${API_BASE_URL}/documents/${documentId}/confirm-work`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionDigest: result.digest,
            feedback: workReview.feedback,
          }),
        });

        setSuccessMessage("Work approved! Provider can now release payment.");
      } else {
        console.log(`📝 Requesting work revisions for escrow ${documentId}...`);

        // For revisions, we just update the backend (no blockchain transaction)
        await fetch(
          `${API_BASE_URL}/documents/${documentId}/request-revisions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedback: workReview.feedback,
              requestedChanges: workReview.requestedChanges,
            }),
          }
        );

        setSuccessMessage("Revision requests sent to provider.");
      }

      setWorkReview({ feedback: "", requestedChanges: "" });
      await loadEscrowData();
    } catch (error: any) {
      console.error("❌ Failed to review work:", error);
      setError(error.message || "Failed to review work");
    } finally {
      setIsReviewingWork(false);
    }
  };

  // 💸 Release payment (Provider only)
  const releasePayment = async () => {
    if (!escrow || !currentAccount || userRole !== "provider") return;

    setIsReleasingPayment(true);
    setError(null);

    try {
      console.log(`💸 Releasing payment for escrow ${documentId}...`);

      const transaction = new Transaction();

      transaction.moveCall({
        target: `${process.env.NEXT_PUBLIC_ESCROW_PACKAGE_ID}::escrow_contract::release_payment`,
        arguments: [
          transaction.object(escrow.escrowContractId!),
          transaction.object("0x6"), // Clock
        ],
      });

      const result = await signAndExecuteTransaction({ transaction });
      console.log("✅ Payment release transaction completed:", result.digest);

      await fetch(`${API_BASE_URL}/documents/${documentId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionDigest: result.digest,
        }),
      });

      setSuccessMessage("Payment released successfully! Contract completed.");
      await loadEscrowData();
    } catch (error: any) {
      console.error("❌ Failed to release payment:", error);
      setError(error.message || "Failed to release payment");
    } finally {
      setIsReleasingPayment(false);
    }
  };

  // Helper functions
  const addAttachmentUrl = () => {
    if (
      newAttachmentUrl.trim() &&
      !workSubmission.attachmentUrls.includes(newAttachmentUrl.trim())
    ) {
      setWorkSubmission((prev) => ({
        ...prev,
        attachmentUrls: [...prev.attachmentUrls, newAttachmentUrl.trim()],
      }));
      setNewAttachmentUrl("");
    }
  };

  const removeAttachmentUrl = (index: number) => {
    setWorkSubmission((prev) => ({
      ...prev,
      attachmentUrls: prev.attachmentUrls.filter((_, i) => i !== index),
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getProgressPercentage = () => {
    if (!escrow) return 0;
    switch (escrow.escrowStatus) {
      case "signed":
        return 20;
      case "funded":
        return 40;
      case "work_submitted":
        return 60;
      case "work_confirmed":
        return 80;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const getCurrentStep = () => {
    if (!escrow) return 1;
    switch (escrow.escrowStatus) {
      case "signed":
        return 1;
      case "funded":
        return 2;
      case "work_submitted":
        return 3;
      case "work_confirmed":
        return 4;
      case "completed":
        return 5;
      default:
        return 1;
    }
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Sui wallet to access the escrow workspace
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading escrow workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !escrow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Escrow
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadEscrowData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!escrow) return null;

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {escrow.title}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Escrow Workspace -{" "}
                    {userRole === "client" ? "Client" : "Service Provider"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {escrow.agreedAmount} SUI
                </p>
                <p className="text-sm text-gray-600">Escrow Amount</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Escrow Progress
          </h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: 1,
                title: "Contract Signed",
                status: "signed",
                icon: FileText,
              },
              {
                step: 2,
                title: "Escrow Funded",
                status: "funded",
                icon: DollarSign,
              },
              {
                step: 3,
                title: "Work Submitted",
                status: "work_submitted",
                icon: Upload,
              },
              {
                step: 4,
                title: "Work Approved",
                status: "work_confirmed",
                icon: CheckCircle,
              },
              {
                step: 5,
                title: "Payment Released",
                status: "completed",
                icon: Package,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;

              return (
                <div key={item.step} className="text-center">
                  <div
                    className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      isCompleted
                        ? "text-green-600"
                        : isActive
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Fund Escrow (Client) */}
            {escrow.escrowStatus === "signed" && userRole === "client" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Fund Escrow Contract
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Ready to fund:</strong> Both parties have signed
                    the contract. Deposit {escrow.agreedAmount} SUI into the
                    escrow to begin the project.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Escrow Amount
                        </p>
                        <p className="text-sm text-gray-600">
                          Funds will be held securely until work completion
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {escrow.agreedAmount} SUI
                        </p>
                        <p className="text-sm text-gray-500">
                          ≈ ${(escrow.agreedAmount * 0.5).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={fundEscrow}
                    disabled={isFundingEscrow}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isFundingEscrow ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Funding Escrow...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Fund Escrow ({escrow.agreedAmount} SUI)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Submit Work (Provider) */}
            {escrow.escrowStatus === "funded" && userRole === "provider" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Submit Completed Work
                  </h3>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 text-sm">
                    🎯 <strong>Escrow funded!</strong> The client has deposited{" "}
                    {escrow.agreedAmount} SUI. You can now submit your completed
                    work for review.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Description *
                    </label>
                    <textarea
                      value={workSubmission.description}
                      onChange={(e) =>
                        setWorkSubmission((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Describe what you've completed, key features, functionality delivered..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Instructions
                    </label>
                    <textarea
                      value={workSubmission.deliveryNotes}
                      onChange={(e) =>
                        setWorkSubmission((prev) => ({
                          ...prev,
                          deliveryNotes: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="How to access/test the work, login credentials, special instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Links & Attachments
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder="https://github.com/your-repo or live demo URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={addAttachmentUrl}
                        disabled={!newAttachmentUrl.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        Add
                      </button>
                    </div>

                    {workSubmission.attachmentUrls.length > 0 && (
                      <div className="space-y-2">
                        {workSubmission.attachmentUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex-1 truncate"
                            >
                              {url}
                            </a>
                            <button
                              onClick={() => removeAttachmentUrl(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={workSubmission.completionNotes}
                      onChange={(e) =>
                        setWorkSubmission((prev) => ({
                          ...prev,
                          completionNotes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Any additional notes, next steps, or recommendations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={submitWork}
                    disabled={
                      isSubmittingWork || !workSubmission.description.trim()
                    }
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingWork ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Submitting Work...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Work for Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Work (Client) */}
            {escrow.escrowStatus === "work_submitted" &&
              userRole === "client" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Review Submitted Work
                    </h3>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Work Submitted
                      </span>
                    </div>
                    <p className="text-blue-800 text-sm">
                      The service provider has submitted their completed work.
                      Please review carefully before making your decision.
                    </p>
                    {escrow.workSubmissionDate && (
                      <p className="text-blue-600 text-xs mt-1">
                        Submitted:{" "}
                        {new Date(escrow.workSubmissionDate).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Display submitted work details */}
                  {escrow.workDescription && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Work Description
                      </h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {escrow.workDescription}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Feedback *
                      </label>
                      <textarea
                        value={workReview.feedback}
                        onChange={(e) =>
                          setWorkReview((prev) => ({
                            ...prev,
                            feedback: e.target.value,
                          }))
                        }
                        rows={4}
                        placeholder="Provide detailed feedback about the submitted work..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requested Changes (if rejecting)
                      </label>
                      <textarea
                        value={workReview.requestedChanges}
                        onChange={(e) =>
                          setWorkReview((prev) => ({
                            ...prev,
                            requestedChanges: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="If you're requesting revisions, specify what needs to be changed..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => reviewWork(true)}
                        disabled={
                          isReviewingWork || !workReview.feedback.trim()
                        }
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {isReviewingWork ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Approve Work
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => reviewWork(false)}
                        disabled={
                          isReviewingWork || !workReview.feedback.trim()
                        }
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Request Revisions
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Step 4: Release Payment (Provider) */}
            {escrow.escrowStatus === "work_confirmed" &&
              userRole === "provider" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Release Payment
                    </h3>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        Work Approved! 🎉
                      </span>
                    </div>
                    <p className="text-green-800 text-sm">
                      Congratulations! The client has approved your work. You
                      can now release the payment to your wallet.
                    </p>
                    {escrow.workConfirmationDate && (
                      <p className="text-green-600 text-xs mt-1">
                        Approved:{" "}
                        {new Date(escrow.workConfirmationDate).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Payment Amount
                        </p>
                        <p className="text-sm text-gray-600">
                          To be released to your wallet
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {escrow.agreedAmount} SUI
                        </p>
                        <p className="text-sm text-gray-500">
                          ≈ ${(escrow.agreedAmount * 0.5).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={releasePayment}
                    disabled={isReleasingPayment}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {isReleasingPayment ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Releasing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 mr-2" />
                        Release Payment ({escrow.agreedAmount} SUI)
                      </>
                    )}
                  </button>
                </div>
              )}

            {/* Step 5: Contract Completed */}
            {escrow.escrowStatus === "completed" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    🎉 Contract Successfully Completed!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    The escrow contract has been successfully completed. Payment
                    has been released and the contract is now closed.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-900">
                        Escrow Funded
                      </p>
                      <p className="text-xs text-blue-700">
                        {escrow.agreedAmount} SUI
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-900">
                        Work Delivered
                      </p>
                      {escrow.workSubmissionDate && (
                        <p className="text-xs text-purple-700">
                          {new Date(
                            escrow.workSubmissionDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-900">
                        Work Approved
                      </p>
                      {escrow.workConfirmationDate && (
                        <p className="text-xs text-green-700">
                          {new Date(
                            escrow.workConfirmationDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <DollarSign className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-yellow-900">
                        Payment Released
                      </p>
                      {escrow.paymentReleaseDate && (
                        <p className="text-xs text-yellow-700">
                          {new Date(
                            escrow.paymentReleaseDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {escrow.paymentReleaseTxHash && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Transaction Details
                      </p>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">
                            {escrow.agreedAmount} SUI
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction:</span>
                          <a
                            href={`https://suiexplorer.com/txblock/${escrow.paymentReleaseTxHash}?network=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-mono"
                          >
                            {escrow.paymentReleaseTxHash.slice(0, 8)}...
                            {escrow.paymentReleaseTxHash.slice(-8)}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waiting States */}
            {escrow.escrowStatus === "signed" && userRole === "provider" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Waiting for Escrow Funding
                  </h3>
                  <p className="text-gray-600">
                    The client needs to fund the escrow with{" "}
                    {escrow.agreedAmount} SUI before you can begin work.
                  </p>
                </div>
              </div>
            )}

            {escrow.escrowStatus === "funded" && userRole === "client" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Work in Progress
                  </h3>
                  <p className="text-gray-600">
                    The service provider is currently working on your project.
                    You'll be notified when they submit their completed work.
                  </p>
                  {escrow.deadline && (
                    <p className="text-sm text-gray-500 mt-2">
                      Deadline: {new Date(escrow.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {escrow.escrowStatus === "work_submitted" &&
              userRole === "provider" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Awaiting Client Review
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your work has been submitted and is currently under review
                      by the client. They will either approve it or request
                      revisions.
                    </p>
                    {escrow.workSubmissionDate && (
                      <p className="text-sm text-gray-500">
                        Submitted:{" "}
                        {new Date(escrow.workSubmissionDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {escrow.escrowStatus === "work_confirmed" &&
              userRole === "client" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Work Approved
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You have approved the submitted work. The service provider
                      can now release the payment to complete the contract.
                    </p>
                    {escrow.workConfirmationDate && (
                      <p className="text-sm text-gray-500">
                        Approved:{" "}
                        {new Date(escrow.workConfirmationDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Non-participant view */}
            {!userRole && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    View Only Access
                  </h3>
                  <p className="text-gray-600">
                    You can view this escrow contract but cannot perform actions
                    as you are not a participant.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                      escrow.escrowStatus === "completed"
                        ? "bg-green-100 text-green-800"
                        : escrow.escrowStatus === "work_confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : escrow.escrowStatus === "work_submitted"
                        ? "bg-amber-100 text-amber-800"
                        : escrow.escrowStatus === "funded"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {escrow.escrowStatus.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {escrow.agreedAmount} SUI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-mono text-xs">
                    {formatAddress(escrow.partyA)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-mono text-xs">
                    {formatAddress(escrow.partyB)}
                  </span>
                </div>
                {escrow.deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="text-xs">
                      {new Date(escrow.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {userRole && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Role:</span>
                    <span className="font-medium capitalize text-blue-600">
                      {userRole}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Timeline
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: "Contract Signed",
                    completed: true,
                    icon: FileText,
                  },
                  {
                    title: "Escrow Funded",
                    completed: [
                      "funded",
                      "work_submitted",
                      "work_confirmed",
                      "completed",
                    ].includes(escrow.escrowStatus),
                    icon: DollarSign,
                    date: escrow.fundingTxHash ? "Completed" : "Pending",
                  },
                  {
                    title: "Work Submitted",
                    completed: [
                      "work_submitted",
                      "work_confirmed",
                      "completed",
                    ].includes(escrow.escrowStatus),
                    icon: Upload,
                    date: escrow.workSubmissionDate || "Pending",
                  },
                  {
                    title: "Work Approved",
                    completed: ["work_confirmed", "completed"].includes(
                      escrow.escrowStatus
                    ),
                    icon: CheckCircle,
                    date: escrow.workConfirmationDate || "Pending",
                  },
                  {
                    title: "Payment Released",
                    completed: escrow.escrowStatus === "completed",
                    icon: Package,
                    date: escrow.paymentReleaseDate || "Pending",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.completed
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            item.completed ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {typeof item.date === "string" &&
                          item.date.includes("T")
                            ? new Date(item.date).toLocaleString()
                            : item.date || "Not started"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirements */}
            {escrow.requirements && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Requirements
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {escrow.requirements}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    window.open(`/document?documentId=${documentId}`, "_blank")
                  }
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Contract PDF
                </button>

                {escrow.blockchainTxHash && (
                  <button
                    onClick={() =>
                      window.open(
                        `https://suiexplorer.com/txblock/${escrow.blockchainTxHash}?network=devnet`,
                        "_blank"
                      )
                    }
                    className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </button>
                )}

                <button
                  onClick={() => (window.location.href = "/dashboard")}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>

                <button
                  onClick={loadEscrowData}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Need Help?
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    If you encounter any issues during the escrow process,
                    contact support or refer to our documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
