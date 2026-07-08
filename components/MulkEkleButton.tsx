"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import MulkForm from "@/components/forms/MulkForm";

export default function MulkEkleButton({
  className,
  onCreated,
}: {
  className?: string;
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Mülk Ekle
      </button>
      {open && (
        <Modal title="Mülk Ekle" onClose={() => setOpen(false)} maxWidthClassName="max-w-xl">
          <MulkForm
            onSuccess={() => {
              setOpen(false);
              onCreated?.();
            }}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
