"use client";
import { Suspense } from "react";

import PartnerDocumentSignPage from "@/components/partner-sign";

export default function PartnerSign() {
  return (
    <Suspense>
      <PartnerDocumentSignPage />;
    </Suspense>
  );
}
