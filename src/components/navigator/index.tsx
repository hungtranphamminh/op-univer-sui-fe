import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Shield,
  Plus,
  Clock,
  DollarSign,
  Users,
  Settings,
  Home,
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      description: "Overview of all contracts",
    },
    {
      name: "Standard Documents",
      href: "/documents",
      icon: FileText,
      description: "Simple document signing",
    },
    {
      name: "Escrow Contracts",
      href: "/escrow",
      icon: Shield,
      description: "Payment-protected contracts",
    },
    {
      name: "Create Document",
      href: "/publish",
      icon: Plus,
      description: "Upload new document",
    },
    {
      name: "Create Escrow",
      href: "/escrow/create",
      icon: DollarSign,
      description: "Create payment contract",
    },
  ];

  const quickActions = [
    {
      name: "My Contracts",
      href: "/my-contracts",
      icon: Users,
      count: "3 active",
    },
    {
      name: "Pending Actions",
      href: "/pending",
      icon: Clock,
      count: "2 pending",
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  DocEscrow
                </span>
              </Link>
            </div>

            {/* Main Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {action.count}
                  </span>
                </Link>
              );
            })}

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb or Status Bar */}
      {pathname !== "/" && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Home className="w-4 h-4" />
                <span>/</span>
                <span className="capitalize">
                  {pathname.split("/").filter(Boolean).join(" / ")}
                </span>
              </div>

              {/* Network indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-500 uppercase">
                  {process.env.NEXT_PUBLIC_SUI_NETWORK || "devnet"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
