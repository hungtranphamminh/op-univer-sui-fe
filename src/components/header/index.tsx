"use client";

import { NotificationBell } from "../notifications/notification-bell";
import { ConnectButton, useAutoConnectWallet } from "@mysten/dapp-kit";

export default function Header() {
  return (
    <div className="w-full h-16 bg-white sticky top-0 z-50 border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div>
        <ConnectButton />
      </div>
      <NotificationBell />
    </div>
  );
}
