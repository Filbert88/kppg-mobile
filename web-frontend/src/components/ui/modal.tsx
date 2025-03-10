import { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function CustomModal({ onClose, children, title }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[400px] max-h-[80%] overflow-auto relative">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
