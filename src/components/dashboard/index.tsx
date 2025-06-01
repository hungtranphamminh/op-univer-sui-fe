"use client";

import React, { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { API_BASE_URL } from "@/utils/const";

// Icon components (inline SVGs)
const Shield = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const Globe = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const DollarSign = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

const Activity = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const Bell = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-5 5v-5zM10.07 2.82l-.84.84A3.5 3.5 0 008 6.5V9a7 7 0 11-14 0V6.5a3.5 3.5 0 00-1.23-2.84l-.84-.84a1 1 0 11-1.42-1.42l.84-.84A5.5 5.5 0 016 0h12a5.5 5.5 0 014.65 2.68l.84.84a1 1 0 11-1.42 1.42z"
    />
  </svg>
);

const Wallet = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const Search = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const Plus = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

// Types
interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalValue: number;
  openEscrows: number;
  pendingJoinRequests: number;
  recentActivity: number;
  completionRate: number;
  averageValue: number;
}

interface RecentContract {
  documentId: string;
  title: string;
  documentType: "escrow_contract" | "open_escrow" | "standard";
  status: string;
  escrowStatus?: string;
  agreedAmount?: number;
  createdAt: string;
  updatedAt: string;
  userRole?: "client" | "provider" | "signer";
  joinRequestCount?: number;
  signedCount?: number;
  totalSigners?: number;
  partyA?: string;
  partyB?: string;
  category?: string;
  deadline?: string;
}

export default function ImprovedDashboard() {
  const currentAccount = useCurrentAccount();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real API functions
  const loadDashboardData = async () => {
    if (!currentAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`📊 Loading dashboard data for ${currentAccount.address}...`);

      // Load stats and recent contracts in parallel
      const [statsResponse, contractsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/documents/user/${currentAccount.address}/stats`),
        fetch(
          `${API_BASE_URL}/documents/user/${currentAccount.address}/contracts?limit=5&offset=0`
        ),
      ]);

      if (!statsResponse.ok || !contractsResponse.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const [statsResult, contractsResult] = await Promise.all([
        statsResponse.json(),
        contractsResponse.json(),
      ]);

      setStats(statsResult.data);
      setRecentContracts(contractsResult.data.contracts || []);

      console.log("✅ Dashboard data loaded:", {
        stats: statsResult.data,
        contracts: contractsResult.data.contracts?.length || 0,
      });
    } catch (error: any) {
      console.error("❌ Failed to load dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");

      // Fallback to mock data for demo
      setStats({
        totalContracts: 12,
        activeContracts: 4,
        completedContracts: 8,
        totalValue: 42.5,
        openEscrows: 2,
        pendingJoinRequests: 3,
        recentActivity: 7,
        completionRate: 87,
        averageValue: 3.5,
      });

      setRecentContracts([
        {
          documentId: "doc_001",
          title: "E-commerce Website Development",
          documentType: "open_escrow",
          status: "open",
          escrowStatus: "open",
          agreedAmount: 8.5,
          createdAt: "2024-12-01T10:00:00Z",
          updatedAt: "2024-12-01T15:30:00Z",
          userRole: "client",
          joinRequestCount: 7,
          category: "Web Development",
          deadline: "2024-12-15T23:59:59Z",
        },
        {
          documentId: "doc_002",
          title: "Logo Design Contract",
          documentType: "escrow_contract",
          status: "published",
          escrowStatus: "work_submitted",
          agreedAmount: 2.5,
          createdAt: "2024-11-28T14:00:00Z",
          updatedAt: "2024-12-01T09:15:00Z",
          userRole: "client",
          partyB: "0xabcdef1234567890abcdef1234567890abcdef12",
        },
        {
          documentId: "doc_003",
          title: "Content Writing Agreement",
          documentType: "escrow_contract",
          status: "published",
          escrowStatus: "completed",
          agreedAmount: 1.8,
          createdAt: "2024-11-25T08:00:00Z",
          updatedAt: "2024-11-30T16:45:00Z",
          userRole: "provider",
          partyA: "0x9876543210fedcba9876543210fedcba98765432",
        },
        {
          documentId: "doc_004",
          title: "Partnership Agreement",
          documentType: "standard",
          status: "published",
          createdAt: "2024-11-20T11:30:00Z",
          updatedAt: "2024-11-22T10:20:00Z",
          userRole: "signer",
          signedCount: 3,
          totalSigners: 3,
        },
        {
          documentId: "doc_005",
          title: "Mobile App Development",
          documentType: "open_escrow",
          status: "awaiting_signatures",
          escrowStatus: "partnered",
          agreedAmount: 15.2,
          createdAt: "2024-11-18T16:00:00Z",
          updatedAt: "2024-11-19T12:30:00Z",
          userRole: "client",
          category: "Mobile Development",
          partyB: "0x1122334455667788990011223344556677889900",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    if (currentAccount) {
      loadDashboardData();
    }
  }, [currentAccount]);

  // Helper functions
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (contract: RecentContract) => {
    const status = contract.escrowStatus || contract.status;
    switch (status) {
      case "completed":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "funded":
      case "work_submitted":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "open":
      case "partnered":
        return "text-violet-600 bg-violet-50 border-violet-200";
      case "published":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "awaiting_signatures":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "ready_for_blockchain":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getContractIcon = (contract: RecentContract) => {
    switch (contract.documentType) {
      case "open_escrow":
        return <Globe className="w-4 h-4 text-violet-600" />;
      case "escrow_contract":
        return <Shield className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleContractClick = (contract: RecentContract) => {
    if (
      contract.documentType === "escrow_contract" ||
      contract.documentType === "open_escrow"
    ) {
      window.open(`/app/workspace/${contract.documentId}`, "_blank");
    } else {
      window.open(`app/contract?documentId=${contract.documentId}`, "_blank");
    }
  };

  // Show wallet connection if not connected
  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Connect Your Wallet
            </h1>
            <p className="text-slate-600 mb-6">
              Please connect your Sui wallet to access the dashboard
            </p>
            <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-slate-700 bg-gray-50">
              <Wallet className="w-4 h-4 mr-2" />
              Wallet connection required
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Shield className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">
                    Dashboard
                  </h1>
                  <p className="text-sm text-slate-500">
                    {formatAddress(currentAccount.address)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-1.5 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => window.open("/dashboard", "_blank")}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Full View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">Showing demo data</p>
              </div>
              <button
                onClick={refreshData}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">
                    Total Contracts
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.totalContracts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.activeContracts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">
                    Total Value
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.totalValue} SUI
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-600">
                    Success Rate
                  </p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {stats.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => window.open("/app/request-publish", "_blank")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">
                      Create Document
                    </h3>
                    <p className="text-sm text-slate-500">
                      Upload and collect signatures
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => window.open("/app/escrow/create", "_blank")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-violet-100 rounded-lg mr-3">
                    <Globe className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">Open Escrow</h3>
                    <p className="text-sm text-slate-500">
                      Find service providers
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => window.open("/app/escrow/create", "_blank")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">
                      Direct Escrow
                    </h3>
                    <p className="text-sm text-slate-500">With known partner</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => window.open("/app/browse", "_blank")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <Search className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">Browse Work</h3>
                    <p className="text-sm text-slate-500">Find opportunities</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Recent Contracts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Contracts
                </h2>
                <button
                  onClick={() => window.open("/dashboard", "_blank")}
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  View all
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse border border-gray-200 rounded-lg p-4"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">
                    No contracts yet
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Create your first contract to get started
                  </p>
                  <button
                    onClick={() =>
                      window.open("/app/request-publish", "_blank")
                    }
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Contract
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.documentId}
                      onClick={() => handleContractClick(contract)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getContractIcon(contract)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-slate-900 truncate">
                                {contract.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                                  contract
                                )}`}
                              >
                                {(
                                  contract.escrowStatus || contract.status
                                ).replace("_", " ")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <span className="capitalize">
                                {contract.userRole || "participant"}
                              </span>
                              {contract.agreedAmount && (
                                <span>{contract.agreedAmount} SUI</span>
                              )}
                              {contract.joinRequestCount !== undefined && (
                                <span>
                                  {contract.joinRequestCount} requests
                                </span>
                              )}
                              {contract.signedCount !== undefined && (
                                <span>
                                  {contract.signedCount}/{contract.totalSigners}{" "}
                                  signed
                                </span>
                              )}
                              <span>
                                {new Date(
                                  contract.updatedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            {stats &&
              (stats.pendingJoinRequests > 0 || stats.recentActivity > 0) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.pendingJoinRequests > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900">
                            {stats.pendingJoinRequests} join request
                            {stats.pendingJoinRequests > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700">
                          Review applications for your open escrows
                        </p>
                      </div>
                    )}
                    {stats.recentActivity > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {stats.recentActivity} recent update
                            {stats.recentActivity > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Activity in the last 7 days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Performance Metrics */}
            {stats && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Success Rate</span>
                      <span className="font-medium text-slate-900">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Average Value</span>
                    <span className="font-medium text-slate-900">
                      {stats.averageValue} SUI
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Open Escrows</span>
                    <span className="font-medium text-slate-900">
                      {stats.openEscrows}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.open("/app/browse", "_blank")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Browse Open Escrows
                </button>
                <button
                  onClick={() => window.open("/app/request-publish", "_blank")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Sign Documents
                </button>
                <button
                  onClick={() => window.open("/app/verify", "_blank")}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Verify Documents
                </button>
                <button
                  onClick={() =>
                    window.open("https://suiexplorer.com", "_blank")
                  }
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Sui Explorer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
