import { Plus, Trash2, User, UserPlus } from "lucide-react";

export default function OtherSigners({
  addOtherSigners,
  signers,
  setNewSignerAddress,
  newSignerAddress,
  setNewSignerName,
  newSignerName,
  setNewSignerEmail,
  newSignerEmail,
  addSigner,
  removeSigner,
}: {
  addOtherSigners: boolean;
  signers: Array<{
    id: string;
    address: string;
    name?: string;
    email?: string;
  }>;
  setNewSignerAddress: (address: string) => void;
  newSignerAddress: string;
  setNewSignerName: (name: string) => void;
  newSignerName: string;
  setNewSignerEmail: (email: string) => void;
  newSignerEmail: string;
  addSigner: () => void;
  removeSigner: (id: string) => void;
}) {
  return (
    <>
      {addOtherSigners && (
        <div className="ml-7 space-y-4">
          {/* Add Signer Form */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <UserPlus className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Add Signer
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  value={newSignerAddress}
                  onChange={(e) => setNewSignerAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSignerName}
                    onChange={(e) => setNewSignerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newSignerEmail}
                    onChange={(e) => setNewSignerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={addSigner}
                disabled={!newSignerAddress.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Signer
              </button>
            </div>
          </div>

          {/* Signers List */}
          {signers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">
                Required Signers ({signers.length})
              </h4>
              {signers.map((signer) => (
                <div
                  key={signer.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {signer.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {signer.address.slice(0, 6)}...
                        {signer.address.slice(-4)}
                      </p>
                      {signer.email && (
                        <p className="text-xs text-gray-400">{signer.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSigner(signer.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
