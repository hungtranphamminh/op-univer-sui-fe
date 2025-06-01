"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Share2,
  Copy,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Globe,
  Lock,
  ExternalLink,
  MoreVertical,
  User,
  FileText,
  Wallet,
  Activity,
  AlertCircle,
  Edit3,
  TrendingUp,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import {
  ContractActivity,
  DashboardStats,
  EscrowContract,
  JoinRequest,
} from "@/types/escrow-contract";
import StatGird from "./stat-grid";
import { formatAddress } from "@/utils/lib/format-address";
import EscrowManagementHeader from "./header";
import { API_BASE_URL } from "@/utils/const";

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

export default function EscrowDashboard() {
  const router = useRouter();

  const currentAccount = useCurrentAccount();

  // State
  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "all" | "open" | "closed" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] =
    useState<EscrowContract | null>(null);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [contractActivity, setContractActivity] = useState<ContractActivity[]>(
    []
  );
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load data when account connects
  useEffect(() => {
    if (currentAccount) {
      loadContracts();
      loadStats();
    }
  }, [currentAccount, selectedTab, searchQuery]);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Real API call to load contracts
  const loadContracts = async () => {
    if (!currentAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters
      if (selectedTab !== "all") {
        if (selectedTab === "open") params.append("type", "open");
        if (selectedTab === "closed") params.append("type", "closed");
        if (selectedTab === "completed") params.append("status", "completed");
      }
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "50");
      params.append("offset", "0");

      console.log(`📡 Loading contracts for ${currentAccount.address}...`);

      const result = await apiCall(
        `/documents/user/${
          currentAccount.address
        }/contracts?${params.toString()}`
      );

      console.log("✅ Contracts loaded:", result.data);
      setContracts(result.data.contracts || []);
    } catch (error: any) {
      console.error("❌ Failed to load contracts:", error);
      setError(error.message || "Failed to load contracts");
      setContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Real API call to load stats
  const loadStats = async () => {
    if (!currentAccount) return;

    try {
      console.log(`📊 Loading stats for ${currentAccount.address}...`);

      const result = await apiCall(
        `/documents/user/${currentAccount.address}/stats`
      );

      setStats(result.data);
    } catch (error: any) {
      console.error("❌ Failed to load stats:", error);
    }
  };

  // Real API call to load join requests
  const loadJoinRequests = async (documentId: string) => {
    if (!currentAccount) return;

    setIsLoadingRequests(true);

    try {
      console.log(`📋 Loading join requests for ${documentId}...`);

      const result = await apiCall(
        `/documents/${documentId}/join-requests?creatorAddress=${currentAccount.address}`
      );

      console.log("✅ Join requests loaded:", result.data);
      setJoinRequests(result.data.joinRequests || []);
    } catch (error: any) {
      console.error("❌ Failed to load join requests:", error);
      setJoinRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Real API call to load contract activity
  const loadContractActivity = async (documentId: string) => {
    if (!currentAccount) return;

    setIsLoadingActivity(true);

    try {
      console.log(`📋 Loading activity for ${documentId}...`);

      const result = await apiCall(`/documents/${documentId}/activity`);

      console.log("✅ Contract activity loaded:", result.data);
      setContractActivity(result.data.activities || []);
    } catch (error: any) {
      console.error("❌ Failed to load contract activity:", error);
      setContractActivity([]);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Real API call to accept join request
  const acceptJoinRequest = async (
    documentId: string,
    partnerAddress: string
  ) => {
    if (!currentAccount) return;

    try {
      console.log(
        `✅ Accepting partner ${partnerAddress} for ${documentId}...`
      );

      await apiCall(`/documents/${documentId}/accept-partner`, {
        method: "POST",
        body: JSON.stringify({
          partnerAddress,
          creatorAddress: currentAccount.address,
        }),
      });

      // Update local contract state
      setContracts((prev) =>
        prev.map((contract) =>
          contract.documentId === documentId
            ? {
                ...contract,
                partyB: partnerAddress,
                escrowStatus: "partnered",
                status: "awaiting_signatures",
                joinRequestCount: 0,
              }
            : contract
        )
      );

      // Update join requests state
      setJoinRequests((prev) =>
        prev.map((req) =>
          req.address === partnerAddress
            ? { ...req, status: "accepted" as const }
            : { ...req, status: "rejected" as const }
        )
      );

      setShowJoinRequests(false);
      setSuccessMessage(
        "Partner accepted successfully! They can now sign the contract."
      );

      // Reload stats to reflect changes
      loadStats();

      console.log("✅ Partner accepted successfully");
    } catch (error: any) {
      console.error("❌ Failed to accept join request:", error);
      setError(error.message || "Failed to accept join request");
    }
  };

  // Real API call to reject join request
  const rejectJoinRequest = async (
    documentId: string,
    partnerAddress: string
  ) => {
    if (!currentAccount) return;

    try {
      console.log(
        `❌ Rejecting partner ${partnerAddress} for ${documentId}...`
      );

      await apiCall(`/documents/${documentId}/reject-partner`, {
        method: "POST",
        body: JSON.stringify({
          partnerAddress,
          creatorAddress: currentAccount.address,
        }),
      });

      // Update join requests state
      setJoinRequests((prev) =>
        prev.map((req) =>
          req.address === partnerAddress
            ? { ...req, status: "rejected" as const }
            : req
        )
      );

      setSuccessMessage("Join request rejected.");

      console.log("✅ Join request rejected successfully");
    } catch (error: any) {
      console.error("❌ Failed to reject join request:", error);
      setError(error.message || "Failed to reject join request");
    }
  };

  // Real API call to archive contract
  const archiveContract = async (documentId: string) => {
    if (!currentAccount) return;

    try {
      console.log(`🗂️ Archiving contract ${documentId}...`);

      await apiCall(
        `/documents/${documentId}?userAddress=${currentAccount.address}`,
        {
          method: "DELETE",
        }
      );

      // Remove from local state
      setContracts((prev) => prev.filter((c) => c.documentId !== documentId));
      setSuccessMessage("Contract archived successfully.");

      // Reload stats
      loadStats();

      console.log("✅ Contract archived successfully");
    } catch (error: any) {
      console.error("❌ Failed to archive contract:", error);
      setError(error.message || "Failed to archive contract");
    }
  };

  // Copy share link functionality
  const copyShareLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSuccessMessage("Share link copied to clipboard!");
      console.log("📋 Share link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      setError("Failed to copy link to clipboard");
    }
  };

  // Navigate to create escrow page
  const handleCreateEscrow = () => {
    router.push("/app/escrow/create");
  };

  // View contract details
  const viewContractDetails = (contract: EscrowContract) => {
    setSelectedContract(contract);
    setShowContractDetails(true);
  };

  // View contract activity
  const viewContractActivity = (contract: EscrowContract) => {
    setSelectedContract(contract);
    setShowActivity(true);
    loadContractActivity(contract.documentId);
  };

  // Filter contracts based on tab and search
  const filteredContracts = contracts.filter((contract) => {
    // Tab filter
    const tabMatch =
      selectedTab === "all" ||
      (selectedTab === "open" && contract.documentType === "open_escrow") ||
      (selectedTab === "closed" &&
        (contract.documentType === "escrow_contract" ||
          contract.documentType === "standard")) ||
      (selectedTab === "completed" &&
        (contract.escrowStatus === "completed" ||
          (contract.status === "published" &&
            contract.documentType === "standard")));

    // Search filter
    const searchMatch =
      !searchQuery.trim() ||
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.category?.toLowerCase().includes(searchQuery.toLowerCase());

    return tabMatch && searchMatch;
  });

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "funded":
      case "work_submitted":
        return "bg-blue-100 text-blue-800";
      case "open":
      case "partnered":
        return "bg-purple-100 text-purple-800";
      case "signed":
      case "published":
        return "bg-indigo-100 text-indigo-800";
      case "awaiting_signatures":
        return "bg-yellow-100 text-yellow-800";
      case "ready_for_blockchain":
        return "bg-orange-100 text-orange-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  // Get appropriate icon for contract activity
  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      "file-plus": <FileText className="w-4 h-4" />,
      "pen-tool": <Edit3 className="w-4 h-4" />,
      "user-plus": <Users className="w-4 h-4" />,
      upload: <TrendingUp className="w-4 h-4" />,
      "check-circle": <CheckCircle className="w-4 h-4" />,
      "dollar-sign": <DollarSign className="w-4 h-4" />,
      "external-link": <ExternalLink className="w-4 h-4" />,
    };
    return iconMap[iconName] || <Activity className="w-4 h-4" />;
  };

  // Format address for display

  // Show wallet connection screen if not connected
  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Sui wallet to view your escrow dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 w-full px-4 sm:px-6 lg:px-8 ">
      <div className="flex items-center gap-6">
        <EscrowManagementHeader
          loadContracts={loadContracts}
          handleCreateEscrow={handleCreateEscrow}
        />

        <StatGird stats={stats} />
      </div>

      {/* Main content */}
      <div className="w-full">
        {/* Success Message */} {/* TODO: add this back later */}
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadContracts();
                }}
                className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Tabs */}
            <div className="flex space-x-1">
              {[
                { key: "all", label: "All Contracts", count: contracts.length },
                {
                  key: "open",
                  label: "Open Escrows",
                  count: contracts.filter(
                    (c) => c.documentType === "open_escrow"
                  ).length,
                },
                {
                  key: "closed",
                  label: "Standard & Escrows",
                  count: contracts.filter(
                    (c) =>
                      c.documentType === "escrow_contract" ||
                      c.documentType === "standard"
                  ).length,
                },
                {
                  key: "completed",
                  label: "Completed",
                  count: contracts.filter(
                    (c) =>
                      c.escrowStatus === "completed" ||
                      (c.status === "published" &&
                        c.documentType === "standard")
                  ).length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        {/* Contracts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contracts...</p>
            </div>
          )}

          {!isLoading && filteredContracts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No contracts found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first contract"}
              </p>
              <button
                onClick={handleCreateEscrow}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Contract
              </button>
            </div>
          )}

          {!isLoading &&
            filteredContracts.length !== 0 &&
            filteredContracts.map((contract) => (
              <div
                key={contract.documentId}
                className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 p-4 group w-full max-w-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 tracking-tight truncate">
                        {contract.title}
                      </h3>
                    </div>

                    {/* Status and Role Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {/* Document Type Badge */}
                      <span
                        className={`px-1.5 py-1 text-xs font-medium rounded-md border ${
                          contract.documentType === "open_escrow"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : contract.documentType === "escrow_contract"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {contract.documentType === "open_escrow" && "Open"}
                        {contract.documentType === "escrow_contract" &&
                          "Closed"}
                        {contract.documentType === "standard" && "Standard"}
                      </span>

                      <span
                        className={`px-1.5 py-1 text-xs font-medium rounded-md ${getStatusColor(
                          contract.escrowStatus || contract.status
                        )}`}
                      >
                        {(contract.escrowStatus || contract.status).replace(
                          "_",
                          " "
                        )}
                      </span>

                      {contract.userRole && (
                        <span className="px-1.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                          {contract.userRole === "client"
                            ? "Client"
                            : contract.userRole === "provider"
                            ? "Provider"
                            : "Signer"}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {contract.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed py-2 border-t border-b border-gray-200">
                        <span className="font-semibold underline mr-1">
                          About:
                        </span>
                        {contract.description}
                      </p>
                    )}

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {contract.agreedAmount && (
                        <div>
                          <p className="text-xs font-semibold mb-0.5">Reward</p>
                          <p className="text-sm font-semibold text-emerald-700">
                            {contract.agreedAmount} SUI
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold mb-0.5">
                          {contract.documentType === "open_escrow"
                            ? "Partner"
                            : contract.documentType === "escrow_contract"
                            ? "Provider"
                            : "Signers"}
                        </p>
                        {contract.documentType === "open_escrow" ? (
                          <div className="flex items-center gap-1">
                            {contract.partyB ? (
                              <span className="text-xs font-medium text-emerald-600">
                                ✓ Found
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-amber-600">
                                ⏳ Seeking
                              </span>
                            )}
                            {contract.joinRequestCount &&
                              contract.joinRequestCount > 0 && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                  {contract.joinRequestCount}
                                </span>
                              )}
                          </div>
                        ) : contract.documentType === "escrow_contract" ? (
                          <p className="text-xs font-mono text-gray-700 truncate">
                            {contract.partyB
                              ? formatAddress(contract.partyB)
                              : "Unassigned"}
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-gray-700">
                            {contract.signedCount || 0}/
                            {contract.totalSigners || 0}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-0.5">Created</p>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(contract.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}

                    <div className="flex items-start">
                      {contract.tags && contract.tags.length > 0 && (
                        <>
                          <div className="font-semibold underline mr-1 text-xs">
                            Tags:
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {contract.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 rounded border border-gray-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {contract.tags.length > 2 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-500 rounded border border-gray-200">
                                +{contract.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Deadline Warning */}
                    {contract.deadline &&
                      new Date(contract.deadline) < new Date() && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded mb-3">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-red-800">
                              Deadline Passed
                            </p>
                            <p className="text-xs text-red-600">
                              {new Date(contract.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Open Escrow Share Section */}
                    {contract.documentType === "open_escrow" &&
                      contract.shareUrl &&
                      !contract.partyB && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-blue-900 mb-1">
                                Find Partners
                              </p>
                              <p className="text-xs text-blue-700">
                                Share link to attract providers
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  copyShareLink(contract.shareUrl ?? "")
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  window.open(contract.shareUrl, "_blank")
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Work Progress for Escrow Contracts */}
                    {contract.documentType === "escrow_contract" &&
                      contract.escrowStatus &&
                      [
                        "funded",
                        "work_submitted",
                        "work_confirmed",
                        "completed",
                      ].includes(contract.escrowStatus) && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-emerald-900 mb-1">
                                Work Progress
                              </p>
                              <div className="text-xs text-emerald-700">
                                {contract.escrowStatus === "funded" &&
                                  "💰 Can begin"}
                                {contract.workSubmitted && "📤 Submitted"}
                                {contract.workConfirmed && "✅ Confirmed"}
                                {contract.paymentConfirmed && "💸 Paid"}
                              </div>
                            </div>
                            {contract.workSubmissionDate && (
                              <p className="text-xs text-emerald-600 font-medium">
                                {new Date(
                                  contract.workSubmissionDate
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* More Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-1 pt-3 mt-3 border-t border-gray-100">
                  {/* Open Escrow Specific Actions */}
                  {contract.documentType === "open_escrow" &&
                    contract.joinRequestCount &&
                    contract.joinRequestCount > 0 &&
                    !contract.partyB && (
                      <button
                        disabled={contract.userRole !== "client"}
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowJoinRequests(true);
                          loadJoinRequests(contract.documentId);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        Requests ({contract.joinRequestCount})
                      </button>
                    )}

                  <button
                    disabled={
                      contract.userRole !== "client" &&
                      contract.userRole !== "provider"
                    }
                    onClick={() => {
                      router.push(
                        `/app/escrow/workspace/${contract.documentId}`
                      );
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    Workspace
                  </button>

                  <button
                    onClick={() => viewContractDetails(contract)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => viewContractActivity(contract)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Activity className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Join Requests Modal */}
      {showJoinRequests && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Join Requests for "{selectedContract.title}"
                </h2>
                <button
                  onClick={() => setShowJoinRequests(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading join requests...</p>
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No join requests yet
                  </h3>
                  <p className="text-gray-600">
                    Share your escrow link to attract service providers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {joinRequests.map((request) => (
                    <div
                      key={request.address}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-5 h-5 text-gray-600" />
                            <h4 className="font-medium text-gray-900">
                              {request.name || "Anonymous"}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                request.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : request.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>

                          <p className="text-sm font-mono text-gray-600 mb-2">
                            {formatAddress(request.address)}
                          </p>

                          {request.message && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                Message:
                              </p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                {request.message}
                              </p>
                            </div>
                          )}

                          {request.portfolioUrl && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                Portfolio:
                              </p>
                              <a
                                href={request.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                {request.portfolioUrl}
                              </a>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Requested:{" "}
                            {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() =>
                                acceptJoinRequest(
                                  selectedContract.documentId,
                                  request.address
                                )
                              }
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                rejectJoinRequest(
                                  selectedContract.documentId,
                                  request.address
                                )
                              }
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showContractDetails && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Contract Details: {selectedContract.title}
                </h2>
                <button
                  onClick={() => setShowContractDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Basic Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedContract.documentType === "open_escrow"
                        ? "Open Escrow"
                        : selectedContract.documentType === "escrow_contract"
                        ? "Closed Escrow"
                        : "Standard Document"}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          selectedContract.escrowStatus ||
                            selectedContract.status
                        )}`}
                      >
                        {(
                          selectedContract.escrowStatus ||
                          selectedContract.status
                        ).replace("_", " ")}
                      </span>
                    </div>
                    {selectedContract.agreedAmount && (
                      <div>
                        <span className="font-medium">Amount:</span>{" "}
                        {selectedContract.agreedAmount} SUI
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(selectedContract.createdAt).toLocaleString()}
                    </div>
                    {selectedContract.deadline && (
                      <div>
                        <span className="font-medium">Deadline:</span>{" "}
                        {new Date(
                          selectedContract.deadline
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Participants
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedContract.publisherAddress && (
                      <div>
                        <span className="font-medium">Publisher:</span>{" "}
                        <span className="font-mono">
                          {formatAddress(selectedContract.publisherAddress)}
                        </span>
                      </div>
                    )}
                    {selectedContract.partyA && (
                      <div>
                        <span className="font-medium">Client:</span>{" "}
                        <span className="font-mono">
                          {formatAddress(selectedContract.partyA)}
                        </span>
                      </div>
                    )}
                    {selectedContract.partyB && (
                      <div>
                        <span className="font-medium">Provider:</span>{" "}
                        <span className="font-mono">
                          {formatAddress(selectedContract.partyB)}
                        </span>
                      </div>
                    )}
                    {selectedContract.signers &&
                      selectedContract.signers.length > 0 && (
                        <div>
                          <span className="font-medium">Signers:</span>
                          <div className="mt-1 space-y-1">
                            {selectedContract.signers.map((signer, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <span className="font-mono text-xs">
                                  {formatAddress(signer.address)}
                                </span>
                                {signer.hasSigned ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {selectedContract.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedContract.description}
                  </p>
                </div>
              )}

              {selectedContract.blockchainTxHash && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Blockchain Info
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Transaction Hash:</span>{" "}
                      <span className="font-mono">
                        {selectedContract.blockchainTxHash}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedContract.shareUrl && (
                    <button
                      onClick={() => copyShareLink(selectedContract.shareUrl!)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </button>
                  )}
                  <button
                    onClick={() => viewContractActivity(selectedContract)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    View Activity
                  </button>
                </div>
                <button
                  onClick={() => setShowContractDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivity && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activity Timeline: {selectedContract.title}
                </h2>
                <button
                  onClick={() => setShowActivity(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {isLoadingActivity ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading activity...</p>
                </div>
              ) : contractActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No activity found
                  </h3>
                  <p className="text-gray-600">
                    Activity will appear here as the contract progresses
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contractActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                        {getActivityIcon(activity.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </h4>
                          <time className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-gray-500 mt-1">
                            By: {formatAddress(activity.user)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowActivity(false)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
