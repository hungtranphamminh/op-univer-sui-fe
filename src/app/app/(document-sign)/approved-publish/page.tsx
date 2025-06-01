import RequestApprovedPage from "@/components/request-approved";
import { Suspense } from "react";

export default function PendingPublishPage() {
  return (
    <Suspense>
      <RequestApprovedPage />;
    </Suspense>
  );
}
