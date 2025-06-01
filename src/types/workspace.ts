export interface EscrowWorkspaceType {
  documentId: string;
  title: string;
  description: string;
  agreedAmount: number;
  partyA: string; // Client
  partyB: string; // Provider
  partyBSignedOnChain: boolean;
  escrowStatus:
  | "signed"
  | "deployed"
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

export interface WorkSubmission {
  description: string;
  deliveryNotes: string;
  attachmentUrls: string[];
  completionNotes: string;
}

export interface WorkReview {
  feedback: string;
  requestedChanges?: string;
}

export interface EscrowWorkspaceProps {
  documentId: string;
}