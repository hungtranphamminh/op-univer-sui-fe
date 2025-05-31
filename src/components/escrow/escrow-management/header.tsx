import { Plus, RefreshCw } from "lucide-react";

export default function EscrowManagementHeader({
  loadContracts,
  handleCreateEscrow,
}: {
  loadContracts: () => void;
  handleCreateEscrow: () => void;
}) {
  return (
    <div className="w-fit py-6">
      <div className="">
        <h1 className="text-3xl font-thin text-gray-900 pr-2 mb-3 ">
          Escrow Dashboard
        </h1>
        <p className="text-base text-gray-600 mb-3">
          Manage your documents and escrow contracts
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={loadContracts}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
        <button
          onClick={handleCreateEscrow}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </button>
      </div>
    </div>
  );
}
