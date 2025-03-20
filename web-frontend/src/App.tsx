import { Routes, Route} from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/navbar";
import HomeScreen from "./components/home-screen";
import MultiStepForm from "./components/fragmentation/multi-step-form";
import DepthAverageForm from "./components/depth-average/depth-average-form";
import Help from "./pages/Help"; // Import Help page
import "./styles/App.css";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<"home" | "fragmentation" | "depthAverage">(
    "home"
  );

  return (
    <main className="flex flex-col min-h-screen min-w-screen bg-[#D9D9D9]">
      <div className="flex flex-col w-full h-full">
        <Navbar />
      </div>

      <div className="flex-1 flex items-center flex-col justify-center overflow-auto">
        <Routes>
          {/* Route for Help Page */}
          <Route path="/help" element={<Help />} />

          {/* Default App Layout */}
          <Route
            path="/"
            element={
              activeScreen === "home" ? (
                <HomeScreen
                  onFragmentasiClick={() => setActiveScreen("fragmentation")}
                  onDepthAverageClick={() => setActiveScreen("depthAverage")}
                />
              ) : activeScreen === "fragmentation" ? (
                <MultiStepForm setActiveScreen={setActiveScreen} />
              ) : (
                <DepthAverageForm setActiveScreen={setActiveScreen} />
              )
            }
          />
        </Routes>
      </div>
    </main>
  );
}
