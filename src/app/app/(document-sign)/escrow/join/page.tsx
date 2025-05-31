"use client";

import JoinEscrow from "@/components/escrow/join-escrow";
import { useSearchParams } from "next/navigation";

export default function JoinOpenEscrowPage() {
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("shareToken") ?? "";

  return <JoinEscrow shareToken={shareToken} />;
}
