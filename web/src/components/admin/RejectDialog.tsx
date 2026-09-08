"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

interface RejectDialogProps {
  message: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function RejectDialog({
  message,
  onConfirm,
  onCancel,
}: RejectDialogProps) {
  const [razon, setRazon] = useState("");
  const trimmed = razon.trim();

  return (
    <Modal open onClose={onCancel} size="sm" hideClose>
      <p className="text-gray-800 font-bold whitespace-pre-line">{message}</p>
      <div className="mt-4">
        <Textarea
          label="Motivo del rechazo (obligatorio)"
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          placeholder="Ej: No tenemos stock de los productos solicitados"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          fullWidth
          disabled={!trimmed}
          onClick={() => trimmed && onConfirm(trimmed)}
        >
          Rechazar pedido
        </Button>
      </div>
    </Modal>
  );
}
