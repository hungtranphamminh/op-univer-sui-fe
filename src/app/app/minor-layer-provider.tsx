"use client";

import { NotificationProvider } from "@/components/notifications/notification-context";

export default function MinorLayerProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
