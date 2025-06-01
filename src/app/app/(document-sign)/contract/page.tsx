"use client";

import ContractDetails from "@/components/contract";
import { Suspense } from "react";

export default function ContractDetailPage() {
  return (
    <Suspense>
      <ContractDetails />;
    </Suspense>
  );
}
