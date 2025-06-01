"use client";

import EscrowConfirmPartnerSigning from "@/components/escrow/join-escrow/confirm-partner";
import { useSearchParams } from "next/navigation";

export default function SignOpenEscrownContractPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") ?? "";

  return <EscrowConfirmPartnerSigning documentId={documentId} />;
}
