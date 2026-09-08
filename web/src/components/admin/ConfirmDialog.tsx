import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "brand" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  tone = "brand",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
}: ConfirmDialogProps) {
  return (
    <Modal open onClose={onCancel} size="sm" hideClose>
      <p className="text-gray-800 font-bold text-center py-2 whitespace-pre-line">
        {message}
      </p>
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          fullWidth
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
