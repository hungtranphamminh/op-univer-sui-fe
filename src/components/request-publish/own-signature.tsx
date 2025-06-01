/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { PenTool, Check, Image, X } from "lucide-react";

export default function OwnSignature({
  addOwnSignature,
  signatureMessage,
  signedMessage,
  isSigningMessage,
  // handleSignMessage,
  signatureImage,
  signatureImageUrl,
  handleSignatureImageChange,
  setIsSigningMessage,
  setSignedMessage,
  setError,
  handleRemoveSignatureImage,
  signatureInputRef,
}: {
  addOwnSignature: boolean;
  signatureMessage: string | null;
  signedMessage: string | null;
  isSigningMessage: boolean;
  setIsSigningMessage: (isSigning: boolean) => void;
  setSignedMessage: (signature: string | null) => void;
  setError: (error: string | null) => void;
  signatureImage: File | null;
  signatureImageUrl: string | null;
  handleSignatureImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveSignatureImage: () => void;
  signatureInputRef: any;
}) {
  console.log(signedMessage, "   adadda   ", signatureImage);

  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // Sign the message with wallet
  const handleSignMessage = async () => {
    if (!signatureMessage || !currentAccount) return;

    setIsSigningMessage(true);
    try {
      const signature = await signPersonalMessage({
        message: new TextEncoder().encode(signatureMessage),
      });

      setSignedMessage(signature.signature);

      console.log("Signed message:", signature.signature);

      setError(null);
    } catch (err) {
      console.error("Failed to sign message:", err);
      setError("Failed to sign message. Please try again.");
    } finally {
      setIsSigningMessage(false);
    }
  };
  const currentAccount = useCurrentAccount();

  return (
    <>
      {addOwnSignature && signatureMessage && (
        <div className="ml-7 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <PenTool className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Your Signature
            </span>
          </div>

          {/* Step 1: Sign Message */}
          <div className="space-y-3">
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Step 1: Sign Agreement Message
                </h4>
                {signedMessage && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Signed</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 mb-3">
                {signatureMessage}
              </div>

              {!signedMessage ? (
                <button
                  onClick={handleSignMessage}
                  disabled={isSigningMessage || !currentAccount}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSigningMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4 mr-2" />
                      Sign with Wallet
                    </>
                  )}
                </button>
              ) : (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                  ✓ Message signed successfully
                </div>
              )}
            </div>

            {/* Step 2: Upload Signature Image */}
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  Step 2: Upload Signature Image
                </h4>
                {signatureImage && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Uploaded</span>
                  </div>
                )}
              </div>

              {!signatureImage ? (
                <div>
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureImageChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={!signedMessage}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Choose Signature Image
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or other image formats. Max 5MB.
                  </p>
                  {!signedMessage && (
                    <p className="text-xs text-amber-600 mt-1">
                      Please sign the message first
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded border">
                    <img
                      src={signatureImageUrl!}
                      alt="Signature"
                      className="h-12 w-auto border rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {signatureImage.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(signatureImage.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveSignatureImage}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    ✓ Signature image uploaded successfully
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Completion Status */}
          {signedMessage && signatureImage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Your signature is ready!
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Both message signature and image have been completed.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
