"use client"
import { X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
}

export default function ImageViewerModal({ isOpen, onClose, imageUrl }: ImageViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-screen-lg w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="w-full h-full flex items-center justify-center bg-black/90 p-4">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt="Full size image"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
