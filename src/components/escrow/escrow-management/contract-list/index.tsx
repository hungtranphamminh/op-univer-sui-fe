import React from "react";
import {
  FileText,
  Plus,
  Globe,
  Lock,
  AlertCircle,
  Copy,
  ExternalLink,
  Users,
  Eye,
  Activity,
  MoreVertical,
} from "lucide-react";

// Type definitions
type DocumentType = "open_escrow" | "escrow_contract" | "document";
type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "work_submitted"
  | "work_confirmed"
  | "completed"
  | "cancelled";
type UserRole = "client" | "provider" | "signer";

interface Contract {
  documentId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  escrowStatus?: EscrowStatus;
  status?: string;
  userRole?: UserRole;
  agreedAmount?: number;
  partyB?: string;
  joinRequestCount?: number;
  signedCount?: number;
  totalSigners?: number;
  createdAt: string;
  deadline?: string;
  tags?: string[];
  shareUrl?: string;
  workSubmitted?: boolean;
  workConfirmed?: boolean;
  paymentConfirmed?: boolean;
  workSubmissionDate?: string;
}

interface ContractsListProps {
  isLoading?: boolean;
  contracts?: Contract[];
  searchQuery?: string;
  onCreateEscrow?: () => void;
  onViewDetails?: (contract: Contract) => void;
  onViewActivity?: (contract: Contract) => void;
  onCopyShareLink?: (shareUrl: string) => void;
  onViewJoinRequests?: (contract: Contract) => void;
  onLoadJoinRequests?: (contractId: string) => void;
}

const ContractsList: React.FC<ContractsListProps> = ({
  isLoading = false,
  contracts = [],
  searchQuery = "",
  onCreateEscrow,
  onViewDetails,
  onViewActivity,
  onCopyShareLink,
  onViewJoinRequests,
  onLoadJoinRequests,
}) => {
  // Helper function to get status color classes
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      funded: "bg-purple-100 text-purple-800",
      work_submitted: "bg-orange-100 text-orange-800",
      work_confirmed: "bg-teal-100 text-teal-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Helper function to format wallet addresses
  const formatAddress = (address?: string): string => {
    if (!address) return "Not assigned";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to calculate progress percentage
  const getProgressPercentage = (contract: Contract): number => {
    if (contract.documentType === "open_escrow") {
      return contract.partyB ? 100 : 50;
    } else if (contract.documentType === "escrow_contract") {
      const statusProgress: Record<string, number> = {
        pending: 20,
        funded: 40,
        work_submitted: 60,
        work_confirmed: 80,
        completed: 100,
      };
      return statusProgress[contract.escrowStatus || ""] || 0;
    } else {
      const signedCount = contract.signedCount || 0;
      const totalSigners = contract.totalSigners || 1;
      return Math.round((signedCount / totalSigners) * 100);
    }
  };

  // Filter contracts based on search query
  const filteredContracts = contracts.filter(
    (contract) =>
      !searchQuery ||
      contract.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Handle view contract details
  const handleViewDetails = (contract: Contract): void => {
    onViewDetails?.(contract);
  };

  // Handle view contract activity
  const handleViewActivity = (contract: Contract): void => {
    onViewActivity?.(contract);
  };

  // Handle copy share link
  const handleCopyShareLink = (shareUrl: string): void => {
    onCopyShareLink?.(shareUrl);
  };

  // Handle view join requests
  const handleViewJoinRequests = (contract: Contract): void => {
    onViewJoinRequests?.(contract);
    onLoadJoinRequests?.(contract.documentId);
  };

  // Handle create new escrow
  const handleCreateEscrow = (): void => {
    onCreateEscrow?.();
  };

  // Get user role display text
  const getUserRoleText = (role: UserRole): string => {
    const roleMap: Record<UserRole, string> = {
      client: "👤 Client",
      provider: "🔧 Provider",
      signer: "✍️ Signer",
    };
    return roleMap[role];
  };

  // Get contract type icon
  const getContractIcon = (documentType: DocumentType) => {
    switch (documentType) {
      case "open_escrow":
        return <Globe className="w-5 h-5 text-blue-600" />;
      case "escrow_contract":
        return <Lock className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get partner status text
  const getPartnerStatusText = (contract: Contract): string => {
    if (contract.documentType === "open_escrow") {
      return contract.partyB ? "✓ Partner Found" : "⏳ Seeking Partner";
    } else if (contract.documentType === "escrow_contract") {
      return formatAddress(contract.partyB);
    } else {
      return `${contract.signedCount || 0}/${
        contract.totalSigners || 0
      } signed`;
    }
  };

  // Get work progress text
  const getWorkProgressText = (contract: Contract): string => {
    if (contract.escrowStatus === "funded")
      return "💰 Escrow funded - work can begin";
    if (contract.workSubmitted) return "📤 Work submitted for review";
    if (contract.workConfirmed) return "✅ Work confirmed by client";
    if (contract.paymentConfirmed) return "💸 Payment released";
    return "";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading contracts...</p>
      </div>
    );
  }

  // Empty state
  if (filteredContracts.length === 0) {
    return (
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Contract
        </button>
      </div>
    );
  }

  // Contracts list
  return (
    <div className="space-y-6">
      {filteredContracts.map((contract: Contract) => (
        <div
          key={contract.documentId}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Contract Header */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center space-x-2">
                  {getContractIcon(contract.documentType)}
                  <h3 className="text-lg font-medium text-gray-900">
                    {contract.title}
                  </h3>
                </div>

                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    contract.escrowStatus || contract.status || ""
                  )}`}
                >
                  {(contract.escrowStatus || contract.status || "")?.replace(
                    "_",
                    " "
                  )}
                </span>

                {/* User role badge */}
                {contract.userRole && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    {getUserRoleText(contract.userRole)}
                  </span>
                )}
              </div>

              {/* Description */}
              {contract.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {contract.description}
                </p>
              )}

              {/* Contract Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Amount */}
                {contract.agreedAmount && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {contract.agreedAmount} SUI
                    </p>
                  </div>
                )}

                {/* Partner/Provider Status */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {contract.documentType === "open_escrow"
                      ? "Partner Status"
                      : contract.documentType === "escrow_contract"
                      ? "Service Provider"
                      : "Signers"}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`text-sm ${
                        contract.documentType === "open_escrow"
                          ? contract.partyB
                            ? "text-green-600"
                            : "text-amber-600"
                          : "text-gray-900 font-mono"
                      }`}
                    >
                      {getPartnerStatusText(contract)}
                    </span>
                    {contract.documentType === "open_escrow" &&
                      contract.joinRequestCount &&
                      contract.joinRequestCount > 0 && (
                        <span className="text-xs text-blue-600">
                          ({contract.joinRequestCount} requests)
                        </span>
                      )}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Progress
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${getProgressPercentage(contract)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {getProgressPercentage(contract)}%
                    </span>
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Created
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {contract.tags && contract.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {contract.tags
                    .slice(0, 3)
                    .map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  {contract.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                      +{contract.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Deadline Warning */}
              {contract.deadline &&
                new Date(contract.deadline) < new Date() && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-700">
                        Deadline passed:{" "}
                        {new Date(contract.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

              {/* Open Escrow Share Section */}
              {contract.documentType === "open_escrow" &&
                contract.shareUrl &&
                !contract.partyB && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Share to find partners
                        </p>
                        <p className="text-xs text-blue-700">
                          Share this link to attract service providers
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleCopyShareLink(contract.shareUrl!)
                          }
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </button>
                        <button
                          onClick={() =>
                            window.open(contract.shareUrl, "_blank")
                          }
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Public
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
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      Work Progress
                    </p>
                    <div className="space-y-1 text-xs text-green-700">
                      {getWorkProgressText(contract)}
                    </div>
                    {contract.workSubmissionDate && (
                      <p className="text-xs text-green-600 mt-1">
                        Last updated:{" "}
                        {new Date(
                          contract.workSubmissionDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Open Escrow Specific Actions */}
              {contract.documentType === "open_escrow" &&
                contract.joinRequestCount &&
                contract.joinRequestCount > 0 &&
                !contract.partyB && (
                  <button
                    onClick={() => handleViewJoinRequests(contract)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    View Requests ({contract.joinRequestCount})
                  </button>
                )}

              {/* View Details Button */}
              <button
                onClick={() => handleViewDetails(contract)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>

              {/* Activity Button */}
              <button
                onClick={() => handleViewActivity(contract)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                <Activity className="w-4 h-4 mr-1" />
                Activity
              </button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded transition-colors"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContractsList;
