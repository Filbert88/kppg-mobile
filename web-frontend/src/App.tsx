import Navbar from "./components/navbar";
import MultiStepForm from "./components/multi-step-form";
import './styles/App.css'

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen min-w-screen bg-[#D9D9D9]">
      <div className="flex flex-col w-full h-full">
        <Navbar />
      </div>
      <div className="flex-1 h-full items-center flex-col justify-center flex overflow-auto">
        <MultiStepForm />
      </div>
    </main>
  );
}
