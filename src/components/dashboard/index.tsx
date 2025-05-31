"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Globe,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  ArrowRight,
  Activity,
  Bell,
  Wallet,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  badge?: string;
}

export default function HomePage() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    if (currentAccount) {
      loadDashboardData();
    }
  }, [currentAccount]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  // Quick actions based on user's contracts
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        title: "Create Document",
        description: "Upload and manage document signatures",
        icon: <FileText className="w-6 h-6" />,
        href: "/app/request-publish",
        color: "bg-blue-500 hover:bg-blue-600",
      },
      {
        title: "Create Open Escrow",
        description: "Find partners for your project",
        icon: <Globe className="w-6 h-6" />,
        href: "/app/escrow/create",
        color: "bg-purple-500 hover:bg-purple-600",
      },
      {
        title: "Create Closed Escrow",
        description: "Direct escrow with known partner",
        icon: <Shield className="w-6 h-6" />,
        href: "/app/escrow/create",
        color: "bg-green-500 hover:bg-green-600",
      },
      {
        title: "Browse Open Escrows",
        description: "Find work opportunities",
        icon: <Search className="w-6 h-6" />,
        href: "/app/browse",
        color: "bg-orange-500 hover:bg-orange-600",
      },
    ];

    // Add badges based on user activity
    if (stats?.pendingJoinRequests && stats.pendingJoinRequests > 0) {
      const escrowAction = actions.find(
        (a) => a.href === "/app/escrow/create-open"
      );
      if (escrowAction) {
        escrowAction.badge = `${stats.pendingJoinRequests} requests`;
      }
    }

    return actions;
  };

  // Get status color for contracts
  const getStatusColor = (contract: RecentContract) => {
    const status = contract.escrowStatus || contract.status;
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "funded":
      case "work_submitted":
        return "bg-blue-100 text-blue-800";
      case "open":
      case "partnered":
        return "bg-purple-100 text-purple-800";
      case "published":
        return "bg-indigo-100 text-indigo-800";
      case "awaiting_signatures":
        return "bg-yellow-100 text-yellow-800";
      case "ready_for_blockchain":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show wallet connection screen if not connected
  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 text-blue-600 mr-4" />
              <h1 className="text-4xl font-bold text-gray-900">
                DocuSign & Escrow
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Secure document signing and escrow services on the Sui blockchain
            </p>
            <div className="flex items-center justify-center space-x-2 text-blue-600 mb-8">
              <Wallet className="w-5 h-5" />
              <span className="text-lg font-medium">
                Connect your Sui wallet to get started
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Document Signing
                </h3>
                <p className="text-gray-600">
                  Upload PDFs, collect signatures, and publish to blockchain for
                  permanent verification
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure Escrow
                </h3>
                <p className="text-gray-600">
                  Protected payments with smart contracts ensuring safe
                  transactions between parties
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Find Partners
                </h3>
                <p className="text-gray-600">
                  Create open escrows to find service providers or discover work
                  opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to start using secure document signing and escrow services?
            </p>
            <div className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white shadow-sm">
              <Wallet className="w-5 h-5 mr-2" />
              Please connect your Sui wallet
            </div>
          </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Dashboard
                  </h1>
                  <p className="text-sm text-gray-600">
                    Welcome back, {formatAddress(currentAccount.address)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Full Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={refreshData}
                className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Contracts
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalContracts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.activeContracts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Value
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalValue} SUI
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.completionRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getQuickActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(action.href)}
                    className={`relative p-6 rounded-lg text-white text-left transition-colors ${action.color} group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {action.icon}
                          <h3 className="ml-3 text-lg font-medium">
                            {action.title}
                          </h3>
                        </div>
                        <p className="text-sm opacity-90 mb-3">
                          {action.description}
                        </p>
                        <div className="flex items-center text-sm">
                          <span>Get started</span>
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      {action.badge && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                            {action.badge}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Contracts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Contracts
                </h2>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
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
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No contracts yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first contract
                  </p>
                  <button
                    onClick={() => router.push("/app/request-publish")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Contract
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.documentId}
                      onClick={() => {
                        if (
                          contract.documentType === "escrow_contract" ||
                          contract.documentType === "open_escrow"
                        ) {
                          router.push(`/app/workspace/${contract.documentId}`);
                        } else {
                          router.push(
                            `/document?documentId=${contract.documentId}`
                          );
                        }
                      }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {contract.documentType === "open_escrow" ? (
                              <Globe className="w-4 h-4 text-purple-600" />
                            ) : contract.documentType === "escrow_contract" ? (
                              <Shield className="w-4 h-4 text-green-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-gray-600" />
                            )}
                            <h3 className="font-medium text-gray-900">
                              {contract.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                contract
                              )}`}
                            >
                              {(
                                contract.escrowStatus || contract.status
                              ).replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Role: {contract.userRole || "signer"}</span>
                            {contract.agreedAmount && (
                              <span>Amount: {contract.agreedAmount} SUI</span>
                            )}
                            {contract.joinRequestCount !== undefined && (
                              <span>Requests: {contract.joinRequestCount}</span>
                            )}
                            {contract.signedCount !== undefined && (
                              <span>
                                Signed: {contract.signedCount}/
                                {contract.totalSigners}
                              </span>
                            )}
                            <span>
                              {new Date(
                                contract.updatedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
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
            {stats && stats.pendingJoinRequests > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Bell className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">
                        {stats.pendingJoinRequests} pending join request
                        {stats.pendingJoinRequests > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Review applications for your open escrows
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full mt-4 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200"
                >
                  View All
                </button>
              </div>
            )}

            {/* Performance Metrics */}
            {stats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Value</span>
                    <span className="font-medium">
                      {stats.averageValue} SUI
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recent Activity</span>
                    <span className="font-medium">
                      {stats.recentActivity} this week
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/app/browse")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Browse Open Escrows
                </button>
                <button
                  onClick={() => router.push("/app/sign")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Sign Documents
                </button>
                <button
                  onClick={() => router.push("/app/verify")}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Verify Documents
                </button>
                <button
                  onClick={() =>
                    window.open("https://suiexplorer.com", "_blank")
                  }
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
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
