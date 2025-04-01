import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HomeScreenProps {
  onFragmentasiClick?: () => void;
  onDepthAverageClick?: () => void;
}

export default function HomeScreen({
  onFragmentasiClick,
  onDepthAverageClick,
}: HomeScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6 w-full max-w-5xl">
      <Button
        onClick={onFragmentasiClick}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Fragmentasi
      </Button>

      <Button
        onClick={onDepthAverageClick}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Depth Average
      </Button>

      {/* Navigate to Help Page */}
      <Button
        onClick={() => navigate("/help")}
        className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-md text-lg"
      >
        Bantuan
      </Button>
    </div>
  );
}
