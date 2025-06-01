"use client";

import EscrowConfirmPartnerSigning from "@/components/escrow/join-escrow/confirm-partner";
import { Suspense } from "react";

export default function SignOpenEscrownContractPage() {
  return (
    <Suspense>
      <EscrowConfirmPartnerSigning />;
    </Suspense>
  );
}
