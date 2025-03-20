import { useState } from "react";
import Navbar from "./components/navbar";
import HomeScreen from "./components/home-screen";
import MultiStepForm from "./components/fragmentation/multi-step-form";
import DepthAverageForm from "./components/depth-average/depth-average-form";
import "./styles/App.css";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<
    "home" | "fragmentation" | "depthAverage"
  >("home");

  return (
    <main className="flex flex-col min-h-screen min-w-screen bg-[#D9D9D9]">
      <div className="flex flex-col w-full h-full">
        <Navbar />
      </div>

      <div className="flex-1 items-center flex-col justify-center flex overflow-auto">
        {activeScreen === "home" && (
          <HomeScreen
            onFragmentasiClick={() => setActiveScreen("fragmentation")}
            onDepthAverageClick={() => setActiveScreen("depthAverage")}
          />
        )}
        {activeScreen === "fragmentation" && (
          <MultiStepForm setActiveScreen={setActiveScreen} />
        )}
        {activeScreen === "depthAverage" && (
          <DepthAverageForm setActiveScreen={setActiveScreen} />
        )}
      </div>
    </main>
  );
}

