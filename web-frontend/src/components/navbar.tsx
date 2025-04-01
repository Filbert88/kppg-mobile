import kppLogo from "../assets/kpp.png";
import bdmLogo from "../assets/bdm.png";

export default function Navbar() {
  return (
    <div className="w-full flex justify-center py-4 px-6 bg-g relative">
      <div className="absolute left-0 top-0">{/* This will be conditionally rendered in the multi-step form */}</div>
      <div className="bg-white rounded-full px-6 py-2 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-20 relative">
            <img
              src={kppLogo}
              alt="Logo 1"
              width={80}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="h-8 w-20 relative">
            <img
              src={bdmLogo}
              alt="Logo 2"
              width={80}
              height={32}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

