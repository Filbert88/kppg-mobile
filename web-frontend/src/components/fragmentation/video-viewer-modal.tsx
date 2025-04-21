import { Dialog, DialogContent } from "@/components/ui/dialog";

export function VideoViewerModal({ isOpen, onClose, videoUrl }: {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-screen-lg w-[90vw] max-h-[90vh] p-4 overflow-hidden bg-black">
        <video
          controls
          autoPlay
          className="w-full h-full rounded-md"
          src={videoUrl || ""}
        />
      </DialogContent>
    </Dialog>
  );
}
