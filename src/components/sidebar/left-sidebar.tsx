"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import homeIcon from "@images/shared/home.svg";
import escrowIcon from "@images/shared/dashboard.svg";
import verifyIcon from "@images/shared/verify.svg";
import setttingIcon from "@images/shared/setting.svg";

export default function LeftSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const pages = [
    {
      name: "Home",
      href: "/app",
      icon: homeIcon.src,
    },
    {
      name: "Escrow Management",
      href: "/app/escrow/manage",
      icon: escrowIcon.src,
    },
    {
      name: "Document Verification",
      href: "/app/document-sign",
      icon: verifyIcon.src,
    },
    {
      name: "Settings",
      href: "/app/settings",
      icon: setttingIcon.src,
    },
  ];

  return (
    <div className="h-full bg-gray-100 px-6 py-20">
      {pages.map((page) => (
        <button
          key={page.name}
          onClick={() => router.push(page.href)}
          className={` cursor-pointer
            ${pathname === page.href ? "bg-white" : "hover:bg-white"}
            transition-all duration-200 ease-in-out
            flex items-center mb-4 p-2 rounded-2xl bg-gray-100 shadow-md`}
          title={page.name}
          aria-label={page.name}
        >
          <Image
            src={page.icon}
            alt={page.name}
            width={60}
            height={60}
            className="mr-2"
          />
        </button>
      ))}
    </div>
  );
}
