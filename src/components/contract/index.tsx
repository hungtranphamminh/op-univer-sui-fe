"use client";
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { API_BASE_URL } from "@/utils/const";
import { formatAddress } from "@/utils/lib/format-address";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";

// Types
interface Signer {
  address: string;
  name?: string;
  email?: string;
  hasSigned: boolean;
  signedAt?: string;
}

interface EscrowDetails {
  partyA: string;
  partyB?: string;
  agreedAmount: number;
  escrowStatus: string;
  escrowContractId?: string;
  partyASigned: boolean;
  partyBSigned: boolean;
  workSubmitted: boolean;
  workConfirmed: boolean;
  paymentConfirmed: boolean;
  workSubmissionDate?: string;
  workConfirmationDate?: string;
  paymentReleaseDate?: string;
  workDescription?: string;
  requirements?: string;
  category?: string;
  deadline?: string;
  isOpen?: boolean;
  shareToken?: string;
  joinRequestCount?: number;
  fundingTxHash?: string;
  workSubmissionTxHash?: string;
  workConfirmationTxHash?: string;
  paymentReleaseTxHash?: string;
}

interface ContractDetails {
  documentId: string;
  title: string;
  description?: string;
  documentType: "standard" | "escrow_contract" | "open_escrow";
  status: string;
  publisherAddress: string;
  publisherHasSigned: boolean;
  signers: Signer[];
  escrowDetails?: EscrowDetails;
  finalPdfHash?: string;
  blockchainTxHash?: string;
  suiObjectId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface Activity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  user?: string;
}

// API Helper Functions
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  console.log(`🌐 API Call: ${options.method || "GET"} ${url}`);

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`✅ API Response:`, data);

  return data;
};

export default function ContractDetails() {
  // Get documentId from URL params
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") || searchParams.get("id");

  // State
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "signers" | "escrow" | "activity"
  >("overview");

  // Load contract data
  const loadContractData = async () => {
    if (!documentId) {
      setError("No document ID provided");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`📋 Loading contract data for document: ${documentId}`);

      // Load main contract details
      const contractResponse = await apiCall(`/documents/${documentId}/status`);
      setContract(contractResponse.data);

      console.log("📋 Contract data loaded:", contractResponse.data);

      // Load escrow details if it's an escrow contract
      if (
        contractResponse.data.escrowDetails ||
        contractResponse.data.documentType === "escrow_contract" ||
        contractResponse.data.documentType === "open_escrow"
      ) {
        try {
          const escrowResponse = await apiCall(
            `/documents/${documentId}/escrow-status`
          );
          setContract((prev) =>
            prev ? { ...prev, escrowDetails: escrowResponse.data } : null
          );
        } catch (escrowError) {
          console.warn("⚠️ Could not load escrow details:", escrowError);
          // Continue without escrow details
        }
      }

      // Load activity timeline
      try {
        const activityResponse = await apiCall(
          `/documents/${documentId}/activity`
        );
        setActivities(activityResponse.data.activities);
      } catch (activityError) {
        console.warn("⚠️ Could not load activity timeline:", activityError);
        // Continue without activity data
      }

      console.log("✅ Contract data loaded successfully");
    } catch (error: any) {
      console.error("❌ Failed to load contract data:", error);
      setError(error.message || "Failed to load contract data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadContractData();
  }, [documentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "work_submitted":
      case "funded":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "open":
      case "partnered":
        return "text-violet-600 bg-violet-50 border-violet-200";
      case "published":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "awaiting_signatures":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "open_escrow":
        return "🌐";
      case "escrow_contract":
        return "🛡️";
      default:
        return "📄";
    }
  };

  const downloadPDF = async () => {
    if (!contract) return;

    try {
      console.log("📄 Downloading PDF for contract:", contract.documentId);

      const response = await fetch(
        `${API_BASE_URL}/documents/${contract.documentId}/pdf`
      );

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const result = await response.json();

      if (result.data && result.data.pdf) {
        // Convert base64 to blob and download
        const byteCharacters = atob(result.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${contract.title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log("✅ PDF downloaded successfully");
      } else {
        throw new Error("Invalid PDF data received");
      }
    } catch (error: any) {
      console.error("❌ Failed to download PDF:", error);
      setError(error.message || "Failed to download PDF");
    }
  };

  if (!documentId) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Missing Document ID
            </h1>
            <p className="text-slate-600 mb-6">
              Please provide a document ID to view contract details.
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Contract Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              {error || "The requested contract could not be found."}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
              >
                ← Go Back
              </button>
              <button
                onClick={loadContractData}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ←
                </button>
                <div className="p-2 bg-slate-100 rounded-lg text-xl">
                  {getTypeIcon(contract.documentType)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    {contract.title}
                  </h1>
                  <p className="text-sm text-slate-500">
                    ID: {contract.documentId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadPDF}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                >
                  📥 PDF
                </button>
                {contract.blockchainTxHash && (
                  <button
                    onClick={() =>
                      window.open(
                        `https://suiexplorer.com/txblock/${contract.blockchainTxHash}?network=devnet`,
                        "_blank"
                      )
                    }
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    🔗 Explorer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Banner */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                  contract.escrowDetails?.escrowStatus || contract.status
                )}`}
              >
                {(
                  contract.escrowDetails?.escrowStatus || contract.status
                ).replace("_", " ")}
              </span>
              <span className="text-sm text-slate-600">
                Created {new Date(contract.createdAt).toLocaleDateString()}
              </span>
              {contract.publishedAt && (
                <span className="text-sm text-slate-600">
                  • Published{" "}
                  {new Date(contract.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-right">
              {contract.escrowDetails?.agreedAmount && (
                <p className="text-lg font-semibold text-emerald-600">
                  {contract.escrowDetails.agreedAmount} SUI
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                "overview",
                "signers",
                contract.escrowDetails && "escrow",
                "activity",
              ]
                .filter(Boolean)
                .map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      selectedTab === tab
                        ? "border-slate-500 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {tab!.charAt(0).toUpperCase() + tab!.slice(1)}
                  </button>
                ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Description
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {contract.description || "No description provided."}
                  </p>
                </div>

                {/* Contract Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Contract Details
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Document Type
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900 capitalize">
                        {contract.documentType.replace("_", " ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Publisher
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900 font-mono">
                        {typeof contract.publisherAddress === "string" &&
                          contract.publisherAddress.length > 0 &&
                          formatAddress(contract.publisherAddress)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Created
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {new Date(contract.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {new Date(contract.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                    {contract.finalPdfHash && (
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-600">
                          PDF Hash
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900 font-mono break-all">
                          {contract.finalPdfHash}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Open Escrow Specific */}
                {contract.documentType === "open_escrow" &&
                  contract.escrowDetails && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4">
                        Open Escrow Details
                      </h3>
                      <div className="space-y-4">
                        {contract.escrowDetails.category && (
                          <div>
                            <dt className="text-sm font-medium text-slate-600">
                              Category
                            </dt>
                            <dd className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                                {contract.escrowDetails.category}
                              </span>
                            </dd>
                          </div>
                        )}
                        {contract.escrowDetails.deadline && (
                          <div>
                            <dt className="text-sm font-medium text-slate-600">
                              Deadline
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900">
                              {new Date(
                                contract.escrowDetails.deadline
                              ).toLocaleString()}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-slate-600">
                            Join Requests
                          </dt>
                          <dd className="mt-1 text-sm text-slate-900">
                            {contract.escrowDetails.joinRequestCount || 0}{" "}
                            applications received
                          </dd>
                        </div>
                        {contract.escrowDetails.shareToken && (
                          <div>
                            <dt className="text-sm font-medium text-slate-600">
                              Share Link
                            </dt>
                            <dd className="mt-1">
                              <div className="flex items-center space-x-2">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                                  /join-escrow/
                                  {contract.escrowDetails.shareToken}
                                </code>
                                <button
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/join-escrow/${contract.escrowDetails?.shareToken}`
                                    )
                                  }
                                  className="text-slate-600 hover:text-slate-800"
                                >
                                  📋
                                </button>
                              </div>
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Requirements (for escrow contracts) */}
                {contract.escrowDetails?.requirements && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      Requirements
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {contract.escrowDetails.requirements}
                    </p>
                  </div>
                )}

                {/* Work Submission (for escrow contracts) */}
                {contract.escrowDetails?.workDescription && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      Submitted Work
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {contract.escrowDetails.workDescription}
                    </p>
                    {contract.escrowDetails.workSubmissionDate && (
                      <p className="text-sm text-slate-500 mt-2">
                        Submitted on{" "}
                        {new Date(
                          contract.escrowDetails.workSubmissionDate
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedTab === "signers" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Signers</h3>
                <div className="space-y-4">
                  {/* Publisher */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-slate-600">
                          P
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Publisher</p>
                        <p className="text-sm text-slate-500 font-mono">
                          {typeof contract.publisherAddress === "string" &&
                            contract.publisherAddress.length > 0 &&
                            formatAddress(contract.publisherAddress)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {contract.publisherHasSigned ? "✅" : "⏳"}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          contract.publisherHasSigned
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {contract.publisherHasSigned ? "Signed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Other Signers */}
                  {contract.signers.map((signer, index) => (
                    <div
                      key={signer.address}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {signer.name || "Anonymous"}
                          </p>
                          <p className="text-sm text-slate-500 font-mono">
                            {formatAddress(signer.address)}
                          </p>
                          {signer.email && (
                            <p className="text-sm text-slate-500">
                              {signer.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {signer.hasSigned ? "✅" : "⏳"}
                        </span>
                        <div className="text-right">
                          <span
                            className={`text-sm font-medium ${
                              signer.hasSigned
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {signer.hasSigned ? "Signed" : "Pending"}
                          </span>
                          {signer.signedAt && (
                            <p className="text-xs text-slate-500">
                              {new Date(signer.signedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Escrow Parties (if applicable) */}
                  {contract.escrowDetails && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-slate-900 mb-3">
                        Escrow Parties
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">💰</span>
                            <div>
                              <p className="font-medium text-blue-900">
                                Client (Party A)
                              </p>
                              <p className="text-sm text-blue-700 font-mono">
                                {formatAddress(contract.escrowDetails.partyA)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              contract.escrowDetails.partyASigned
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {contract.escrowDetails.partyASigned
                              ? "Signed"
                              : "Pending"}
                          </span>
                        </div>

                        {contract.escrowDetails.partyB ? (
                          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">📦</span>
                              <div>
                                <p className="font-medium text-emerald-900">
                                  Provider (Party B)
                                </p>
                                <p className="text-sm text-emerald-700 font-mono">
                                  {formatAddress(contract.escrowDetails.partyB)}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                contract.escrowDetails.partyBSigned
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {contract.escrowDetails.partyBSigned
                                ? "Signed"
                                : "Pending"}
                            </span>
                          </div>
                        ) : (
                          <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">👥</span>
                              <div>
                                <p className="font-medium text-violet-900">
                                  Provider (Party B)
                                </p>
                                <p className="text-sm text-violet-700">
                                  No provider selected yet
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signing Progress */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-slate-900 mb-3">
                      Signing Progress
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-medium text-slate-900">
                            {(contract.publisherHasSigned ? 1 : 0) +
                              contract.signers.filter((s) => s.hasSigned)
                                .length}{" "}
                            /{" "}
                            {(contract.publisherHasSigned ? 1 : 0) +
                              contract.signers.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                (((contract.publisherHasSigned ? 1 : 0) +
                                  contract.signers.filter((s) => s.hasSigned)
                                    .length) /
                                  ((contract.publisherHasSigned ? 1 : 0) +
                                    contract.signers.length)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "escrow" && contract.escrowDetails && (
              <div className="space-y-6">
                {/* Escrow Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Escrow Details
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Agreed Amount
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-emerald-600">
                        {contract.escrowDetails.agreedAmount} SUI
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-600">
                        Escrow Status
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            contract.escrowDetails.escrowStatus
                          )}`}
                        >
                          {contract.escrowDetails.escrowStatus.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </dd>
                    </div>
                    {contract.escrowDetails.escrowContractId && (
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-600">
                          Contract ID
                        </dt>
                        <dd className="mt-1 text-sm text-slate-900 font-mono break-all">
                          {contract.escrowDetails.escrowContractId}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Escrow Progress */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Escrow Progress
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: "Signed",
                        completed:
                          contract.escrowDetails.partyASigned &&
                          contract.escrowDetails.partyBSigned,
                        icon: "📄",
                      },
                      {
                        step: "Funded",
                        completed: !!contract.escrowDetails.fundingTxHash,
                        icon: "💰",
                      },
                      {
                        step: "Work Submitted",
                        completed: contract.escrowDetails.workSubmitted,
                        icon: "📦",
                        date: contract.escrowDetails.workSubmissionDate,
                      },
                      {
                        step: "Work Confirmed",
                        completed: contract.escrowDetails.workConfirmed,
                        icon: "✅",
                        date: contract.escrowDetails.workConfirmationDate,
                      },
                      {
                        step: "Payment Released",
                        completed: contract.escrowDetails.paymentConfirmed,
                        icon: "💸",
                        date: contract.escrowDetails.paymentReleaseDate,
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.completed
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              item.completed
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {item.step}
                          </p>
                          {item.date && (
                            <p className="text-xs text-slate-500">
                              {new Date(item.date).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {item.completed && (
                          <span className="text-emerald-500">✅</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction History */}
                {(contract.escrowDetails.fundingTxHash ||
                  contract.escrowDetails.workSubmissionTxHash ||
                  contract.escrowDetails.workConfirmationTxHash ||
                  contract.escrowDetails.paymentReleaseTxHash) && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Transaction History
                    </h3>
                    <div className="space-y-3">
                      {contract.escrowDetails.fundingTxHash && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-blue-600">💰</span>
                            <span className="text-sm font-medium text-blue-900">
                              Escrow Funded
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://suiexplorer.com/txblock/${contract.escrowDetails?.fundingTxHash}?network=devnet`,
                                "_blank"
                              )
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-mono"
                          >
                            {contract.escrowDetails?.fundingTxHash?.slice(0, 8)}
                            ...
                            {contract.escrowDetails?.fundingTxHash?.slice(-8)}
                          </button>
                        </div>
                      )}
                      {contract.escrowDetails.workSubmissionTxHash && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-purple-600">📦</span>
                            <span className="text-sm font-medium text-purple-900">
                              Work Submitted
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://suiexplorer.com/txblock/${contract.escrowDetails?.workSubmissionTxHash}?network=devnet`,
                                "_blank"
                              )
                            }
                            className="text-xs text-purple-600 hover:text-purple-800 font-mono"
                          >
                            {contract.escrowDetails?.workSubmissionTxHash?.slice(
                              0,
                              8
                            )}
                            ...
                            {contract.escrowDetails?.workSubmissionTxHash?.slice(
                              -8
                            )}
                          </button>
                        </div>
                      )}
                      {contract.escrowDetails?.workConfirmationTxHash && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-emerald-600">✅</span>
                            <span className="text-sm font-medium text-emerald-900">
                              Work Confirmed
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://suiexplorer.com/txblock/${contract.escrowDetails?.workConfirmationTxHash}?network=devnet`,
                                "_blank"
                              )
                            }
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-mono"
                          >
                            {contract.escrowDetails?.workConfirmationTxHash?.slice(
                              0,
                              8
                            )}
                            ...
                            {contract.escrowDetails?.workConfirmationTxHash?.slice(
                              -8
                            )}
                          </button>
                        </div>
                      )}
                      {contract.escrowDetails.paymentReleaseTxHash && (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-green-600">💸</span>
                            <span className="text-sm font-medium text-green-900">
                              Payment Released
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              window.open(
                                `https://suiexplorer.com/txblock/${contract.escrowDetails?.paymentReleaseTxHash}?network=devnet`,
                                "_blank"
                              )
                            }
                            className="text-xs text-green-600 hover:text-green-800 font-mono"
                          >
                            {contract.escrowDetails?.paymentReleaseTxHash?.slice(
                              0,
                              8
                            )}
                            ...
                            {contract.escrowDetails?.paymentReleaseTxHash?.slice(
                              -8
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === "activity" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Activity Timeline
                </h3>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity, index) => {
                      const getActivityIcon = (iconType: string) => {
                        switch (iconType) {
                          case "file-plus":
                          case "created":
                            return "📄";
                          case "pen-tool":
                          case "signed":
                            return "✅";
                          case "user-plus":
                          case "partner_joined":
                            return "👥";
                          case "upload":
                          case "work_submitted":
                            return "📦";
                          case "check-circle":
                          case "work_confirmed":
                            return "✅";
                          case "dollar-sign":
                          case "payment_released":
                            return "💸";
                          case "external-link":
                          case "published":
                            return "🔗";
                          default:
                            return "📄";
                        }
                      };

                      const getBgColor = (type: string) => {
                        switch (type) {
                          case "created":
                            return "bg-blue-100";
                          case "signed":
                            return "bg-emerald-100";
                          case "partner_joined":
                            return "bg-purple-100";
                          case "work_submitted":
                            return "bg-purple-100";
                          case "work_confirmed":
                            return "bg-emerald-100";
                          case "payment_released":
                            return "bg-green-100";
                          case "published":
                            return "bg-indigo-100";
                          default:
                            return "bg-slate-100";
                        }
                      };

                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 ${getBgColor(
                              activity.type
                            )} rounded-full flex items-center justify-center`}
                          >
                            <span className="text-sm">
                              {getActivityIcon(activity.icon)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-slate-600">
                              {activity.description}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback: Create basic timeline from contract data
                    <>
                      {/* Contract Created */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm">📄</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            Contract Created
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(contract.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Publisher Signed */}
                      {contract.publisherHasSigned && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">✅</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Publisher Signed
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(contract.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Other Signers */}
                      {contract.signers
                        .filter((s) => s.hasSigned)
                        .map((signer) => (
                          <div
                            key={signer.address}
                            className="flex items-start space-x-3"
                          >
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-sm">✅</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {signer.name || "Signer"} signed the contract
                              </p>
                              <p className="text-xs text-slate-500">
                                {signer.signedAt
                                  ? new Date(signer.signedAt).toLocaleString()
                                  : "Date unknown"}
                              </p>
                            </div>
                          </div>
                        ))}

                      {/* Escrow Activities */}
                      {contract.escrowDetails && (
                        <>
                          {contract.escrowDetails.fundingTxHash && (
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💰</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  Escrow Funded
                                </p>
                                <p className="text-xs text-slate-500">
                                  {contract.escrowDetails.agreedAmount} SUI
                                  deposited
                                </p>
                              </div>
                            </div>
                          )}

                          {contract.escrowDetails.workSubmitted && (
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">📦</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  Work Submitted
                                </p>
                                <p className="text-xs text-slate-500">
                                  {contract.escrowDetails.workSubmissionDate
                                    ? new Date(
                                        contract.escrowDetails.workSubmissionDate
                                      ).toLocaleString()
                                    : "Recently submitted"}
                                </p>
                              </div>
                            </div>
                          )}

                          {contract.escrowDetails.workConfirmed && (
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">✅</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  Work Confirmed
                                </p>
                                <p className="text-xs text-slate-500">
                                  {contract.escrowDetails.workConfirmationDate
                                    ? new Date(
                                        contract.escrowDetails.workConfirmationDate
                                      ).toLocaleString()
                                    : "Recently confirmed"}
                                </p>
                              </div>
                            </div>
                          )}

                          {contract.escrowDetails.paymentConfirmed && (
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm">💸</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  Payment Released
                                </p>
                                <p className="text-xs text-slate-500">
                                  {contract.escrowDetails.paymentReleaseDate
                                    ? new Date(
                                        contract.escrowDetails.paymentReleaseDate
                                      ).toLocaleString()
                                    : "Recently released"}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Published to Blockchain */}
                      {contract.publishedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm">🔗</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              Published to Blockchain
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(contract.publishedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={downloadPDF}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                >
                  📥 Download PDF
                </button>

                {contract.escrowDetails && (
                  <button
                    onClick={() =>
                      window.open(
                        `/app/escrow/workspace/${contract.documentId}`,
                        "_blank"
                      )
                    }
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                  >
                    👁️ Open Workspace
                  </button>
                )}

                {contract.blockchainTxHash && (
                  <button
                    onClick={() =>
                      window.open(
                        `https://suiexplorer.com/txblock/${contract.blockchainTxHash}?network=devnet`,
                        "_blank"
                      )
                    }
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                  >
                    🔗 View on Explorer
                  </button>
                )}

                <button
                  onClick={loadContractData}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                >
                  🔄 Refresh Data
                </button>

                {/* Copy Share Link for Open Escrow */}
                {contract.documentType === "open_escrow" &&
                  contract.escrowDetails?.shareToken && (
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/app/escrow/join?shareToken=${contract.escrowDetails?.shareToken}`;
                        navigator.clipboard.writeText(shareUrl);
                        // You could add a toast notification here
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                    >
                      📋 Copy Share Link
                    </button>
                  )}

                {/* View Join Requests for Open Escrow */}
                {contract.documentType === "open_escrow" &&
                  contract.escrowDetails?.joinRequestCount &&
                  contract.escrowDetails.joinRequestCount > 0 && (
                    <button
                      onClick={() =>
                        window.open(
                          `/app/escrow/manage?documentId=${contract.documentId}`,
                          "_blank"
                        )
                      }
                      className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                    >
                      👥 View Join Requests (
                      {contract.escrowDetails.joinRequestCount})
                    </button>
                  )}
              </div>
            </div>

            {/* Document Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Document Info
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Type
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 capitalize">
                    {contract.documentType.replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        contract.escrowDetails?.escrowStatus || contract.status
                      )}`}
                    >
                      {(
                        contract.escrowDetails?.escrowStatus || contract.status
                      ).replace("_", " ")}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Updated
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {new Date(contract.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
                {contract.escrowDetails?.agreedAmount && (
                  <div>
                    <dt className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Value
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-emerald-600">
                      {contract.escrowDetails.agreedAmount} SUI
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Progress Summary */}
            {contract.escrowDetails && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Progress Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Signatures</span>
                    <span className="text-sm font-medium text-slate-900">
                      {contract.escrowDetails.partyASigned &&
                      contract.escrowDetails.partyBSigned
                        ? "✅"
                        : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Funding</span>
                    <span className="text-sm font-medium text-slate-900">
                      {contract.escrowDetails.fundingTxHash ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Work</span>
                    <span className="text-sm font-medium text-slate-900">
                      {contract.escrowDetails.workSubmitted ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Approval</span>
                    <span className="text-sm font-medium text-slate-900">
                      {contract.escrowDetails.workConfirmed ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Payment</span>
                    <span className="text-sm font-medium text-slate-900">
                      {contract.escrowDetails.paymentConfirmed ? "✅" : "⏳"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Network Status */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <h4 className="text-sm font-medium text-slate-900 mb-2">
                Network Info
              </h4>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="font-mono">Sui Devnet</span>
                </div>
                <div className="flex justify-between">
                  <span>API:</span>
                  <span
                    className={`${
                      API_BASE_URL.includes("localhost")
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {API_BASE_URL.includes("localhost")
                      ? "Development"
                      : "Production"}
                  </span>
                </div>
                {contract.suiObjectId && (
                  <div className="flex justify-between">
                    <span>Object ID:</span>
                    <span className="font-mono">
                      {contract.suiObjectId.slice(0, 6)}...
                      {contract.suiObjectId.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
