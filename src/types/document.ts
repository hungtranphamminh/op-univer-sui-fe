export interface DocumentData {
  documentId: string;
  title: string;
  description?: string;
  publisherAddress: string;
  publisherHasSigned: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  signers: Array<{
    address: string;
    name?: string;
    email?: string;
    hasSigned: boolean;
    signedAt?: string;
  }>;
  signedCount: number;
  totalSigners: number;
  isReadyForBlockchain: boolean;
  pdfUrl: string;
  pdfBase64: string;
}

export interface SignerInfo {
  address: string;
  name?: string;
  email?: string;
  hasSigned: boolean;
  signedAt?: string;
}
