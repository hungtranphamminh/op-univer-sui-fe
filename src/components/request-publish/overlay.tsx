export default function Overlay({ requestStatus }: { requestStatus: string }) {
  return requestStatus === "none" ? (
    <></>
  ) : (
    <div className="w-full h-full absolute z-10 bg-black/25 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-sm text-gray-700">
          Your request is currently in progress. Please wait while we process
          it.
        </p>
      </div>
    </div>
  );
}
