"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import KiraciForm from "@/components/forms/KiraciForm";

export default function KiraciEkleButton({
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
        Kiracı Ekle
      </button>
      {open && (
        <Modal title="Kiracı Ekle" onClose={() => setOpen(false)} maxWidthClassName="max-w-2xl">
          <KiraciForm
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
