import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(0,0,0,0.6)]">
      <Loader2 className="h-8 w-8 animate-spin text-black" />
    </div>
  );
};

export default Loading;
