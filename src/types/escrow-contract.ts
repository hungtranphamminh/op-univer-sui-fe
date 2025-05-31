export interface EscrowContract {
  documentId: string;
  title: string;
  description?: string;
  documentType: "escrow_contract" | "open_escrow" | "standard";
  status: string;
  escrowStatus?: string;
  agreedAmount?: number;
  partyA?: string;
  partyB?: string;
  partyASigned?: boolean;
  partyBSigned?: boolean;
  shareToken?: string;
  shareUrl?: string;
  joinRequestCount?: number;
  category?: string;
  tags?: string[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  blockchainTxHash?: string;
  escrowContractId?: string;
  userRole?: "client" | "provider" | "signer";

  // Work progress
  workSubmitted?: boolean;
  workConfirmed?: boolean;
  paymentConfirmed?: boolean;
  workSubmissionDate?: string;
  workConfirmationDate?: string;
  paymentReleaseDate?: string;

  // Standard document fields
  signers?: Array<{
    address: string;
    name?: string;
    hasSigned: boolean;
  }>;
  signedCount?: number;
  totalSigners?: number;
  publisherAddress?: string;
  publisherHasSigned?: boolean;
}

export interface JoinRequest {
  address: string;
  name?: string;
  message?: string;
  portfolioUrl?: string;
  requestedAt: string;
  status: "pending" | "accepted" | "rejected";
}

export interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalValue: number;
  openEscrows: number;
  pendingJoinRequests: number;
  recentActivity?: number;
  completionRate?: number;
  averageValue?: number;
}

export interface ContractActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  user?: string;
}