"use client";
import { use } from "react";

import EscrowWorkspace from "@/components/escrow/workspace";

export default function EscrowWorkspacePage({
  params,
}: {
  readonly params: Promise<{ documentId: string }>;
}) {
  const documentId = use(params).documentId;

  return <EscrowWorkspace documentId={documentId} />;
}
