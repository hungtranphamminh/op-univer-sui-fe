"use client";
/* eslint-disable  @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import {
  Clock,
  User,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Users,
  Send,
  Loader,
  Share2,
  Shield,
  DollarSign,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { API_BASE_URL } from "@/utils/const";
import { useSearchParams } from "next/navigation";

// Types
interface PublicEscrowDetails {
  documentId: string;
  title: string;
  description?: string;
  agreedAmount: number;
  category?: string;
  tags?: string[];
  deadline?: string;
  requirements?: string;
  publisherAddress: string;
  status: string;
  joinRequestCount: number;
  hasPartner: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JoinRequestForm {
  name: string;
  message: string;
  portfolioUrl: string;
}

// API helper functions
const apiCall = async (endpoint: string, options?: RequestInit) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export default function JoinEscrow() {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("shareToken") ?? "";
  const currentAccount = useCurrentAccount();

  // State
  const [escrowDetails, setEscrowDetails] =
    useState<PublicEscrowDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinForm, setJoinForm] = useState<JoinRequestForm>({
    name: "",
    message: "",
    portfolioUrl: "",
  });

  // Load escrow details on mount
  useEffect(() => {
    if (shareToken) {
      loadEscrowDetails();
    }
  }, [shareToken]);

  // Load public escrow details
  const loadEscrowDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📡 Loading public escrow details for token: ${shareToken}`);

      const result = await apiCall(`/documents/public/${shareToken}`);

      console.log("✅ Escrow details loaded:", result.data);
      setEscrowDetails(result.data);
    } catch (error: any) {
      console.error("❌ Failed to load escrow details:", error);
      setError(error.message || "Failed to load escrow details");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit join request
  const submitJoinRequest = async () => {
    if (!currentAccount || !escrowDetails) return;

    // Validate form
    if (!joinForm.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!joinForm.message.trim()) {
      setError("Please provide a message explaining why you want to join");
      return;
    }

    setIsSubmittingJoin(true);
    setError(null);

    try {
      console.log(`📤 Submitting join request for ${shareToken}...`);

      const joinData = {
        address: currentAccount.address,
        name: joinForm.name.trim(),
        message: joinForm.message.trim(),
        portfolioUrl: joinForm.portfolioUrl.trim() || undefined,
      };

      await apiCall(`/documents/public/${shareToken}/join`, {
        method: "POST",
        body: JSON.stringify(joinData),
      });

      console.log("✅ Join request submitted successfully");
      setJoinSuccess(true);
      setShowJoinForm(false);

      // Reload escrow details to update request count
      loadEscrowDetails();
    } catch (error: any) {
      console.error("❌ Failed to submit join request:", error);
      setError(error.message || "Failed to submit join request");
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Handle form changes
  const handleFormChange = (field: keyof JoinRequestForm, value: string) => {
    setJoinForm((prev) => ({ ...prev, [field]: value }));
    setError(null); // Clear errors when user types
  };

  // Copy share link
  const copyShareLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      // You can add a toast notification here
      console.log("📋 Share link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Escrow Details
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the contract information
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !escrowDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Escrow
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadEscrowDetails}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state after joining
  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Join Request Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your request to join &apos;{escrowDetails?.title}&apos; has been
            sent to the client. They will review your request and get back to
            you soon.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setJoinSuccess(false);
                setShowJoinForm(false);
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View Escrow Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!escrowDetails) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Open Escrow Contract
                </h1>
                <p className="text-sm text-gray-600">
                  Review the details and apply to become the service provider
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {escrowDetails.title}
                  </h2>
                  {escrowDetails.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {escrowDetails.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={copyShareLink}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                  title="Share this escrow"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Payment Amount
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {escrowDetails.agreedAmount} SUI
                    </p>
                  </div>
                </div>

                {escrowDetails.deadline && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Deadline
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(escrowDetails.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getDaysUntilDeadline(escrowDetails.deadline)} days
                        remaining
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Client</p>
                    <p className="text-sm font-mono text-gray-900">
                      {formatAddress(escrowDetails.publisherAddress)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Interest Level
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {escrowDetails.joinRequestCount} requests
                    </p>
                  </div>
                </div>
              </div>

              {/* Category and Tags */}
              {(escrowDetails.category ||
                (escrowDetails.tags && escrowDetails.tags.length > 0)) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Category & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {escrowDetails.category && (
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                        <Tag className="w-3 h-3 mr-1" />
                        {escrowDetails.category}
                      </span>
                    )}
                    {escrowDetails.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {escrowDetails.requirements && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Requirements
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {escrowDetails.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Indicators */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Escrow Protected</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Public Contract</span>
                    </div>
                  </div>
                  <span className="text-gray-500">
                    Posted{" "}
                    {new Date(escrowDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                How Escrow Protection Works
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Apply & Get Selected
                    </h4>
                    <p className="text-sm text-gray-600">
                      Submit your application with details about your experience
                      and approach.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Sign Contract & Client Funds Escrow
                    </h4>
                    <p className="text-sm text-gray-600">
                      Both parties sign the contract and the client deposits
                      payment into escrow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Complete Work & Get Paid
                    </h4>
                    <p className="text-sm text-gray-600">
                      Deliver the work, get client approval, and receive
                      automatic payment from escrow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Connection Status */}
            {!currentAccount ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your Sui wallet to apply for this escrow contract
                  </p>
                  <p className="text-xs text-gray-500">
                    You&apos;ll need a wallet to receive payments and sign the
                    contract
                  </p>
                </div>
              </div>
            ) : escrowDetails.hasPartner ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Position Filled
                  </h3>
                  <p className="text-sm text-gray-600">
                    This escrow contract already has a service provider. Check
                    out other available contracts!
                  </p>
                </div>
              </div>
            ) : (
              /* Application Section */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Apply for This Project
                </h3>

                {!showJoinForm ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Escrow Protected
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Payment is guaranteed and held in escrow until work is
                        completed and approved.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Your wallet:</span>
                        <span className="font-mono text-gray-900">
                          {formatAddress(currentAccount.address)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Competition:</span>
                        <span className="text-gray-900">
                          {escrowDetails.joinRequestCount} other applicants
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowJoinForm(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Free to apply • No commitment until contract is signed
                    </p>
                  </div>
                ) : (
                  /* Application Form */
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={joinForm.name}
                        onChange={(e) =>
                          handleFormChange("name", e.target.value)
                        }
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Why You&apos;re Perfect for This Job *
                      </label>
                      <textarea
                        value={joinForm.message}
                        onChange={(e) =>
                          handleFormChange("message", e.target.value)
                        }
                        placeholder="Explain your relevant experience, approach to this project, and why the client should choose you..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Be specific about your skills and experience
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio/Website (Optional)
                      </label>
                      <input
                        type="url"
                        value={joinForm.portfolioUrl}
                        onChange={(e) =>
                          handleFormChange("portfolioUrl", e.target.value)
                        }
                        placeholder="https://yourportfolio.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">
                        <strong>Your wallet address:</strong>
                        <br />
                        <span className="font-mono">
                          {currentAccount.address}
                        </span>
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowJoinForm(false)}
                        disabled={isSubmittingJoin}
                        className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitJoinRequest}
                        disabled={
                          isSubmittingJoin ||
                          !joinForm.name.trim() ||
                          !joinForm.message.trim()
                        }
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSubmittingJoin ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posted</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(escrowDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="text-sm font-medium text-gray-900">
                    {escrowDetails.joinRequestCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    {escrowDetails.hasPartner
                      ? "Position Filled"
                      : "Open for Applications"}
                  </span>
                </div>
                {escrowDetails.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time Left</span>
                    <span
                      className={`text-sm font-medium ${
                        getDaysUntilDeadline(escrowDetails.deadline) < 7
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {getDaysUntilDeadline(escrowDetails.deadline)} days
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900">
                    Safety Tips
                  </h4>
                  <ul className="text-xs text-amber-700 mt-1 space-y-1">
                    <li>• Never share your private keys</li>
                    <li>• Verify contract details carefully</li>
                    <li>• Payment is protected by escrow</li>
                    <li>• Work is released only after approval</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
