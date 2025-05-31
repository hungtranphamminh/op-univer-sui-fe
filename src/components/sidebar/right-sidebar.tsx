"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { NotificationBell } from "../notifications/notification-bell";

export default function RightSideBar() {
  return (
    <div className="h-full  bg-white flex items-start px-6 py-20 gap-6">
      <div>
        <ConnectButton />
      </div>
      <NotificationBell />
    </div>
  );
}
