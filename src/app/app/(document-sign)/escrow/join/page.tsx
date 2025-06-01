"use client";

import JoinEscrow from "@/components/escrow/join-escrow";
import { Suspense } from "react";

export default function JoinOpenEscrowPage() {
  return (
    <Suspense>
      <JoinEscrow />;
    </Suspense>
  );
}
