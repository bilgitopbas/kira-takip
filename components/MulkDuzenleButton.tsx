"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import MulkForm from "@/components/forms/MulkForm";

export default function MulkDuzenleButton({
  propertyId,
  className,
  onUpdated,
}: {
  propertyId: string;
  className?: string;
  onUpdated?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Düzenle
      </button>
      {open && (
        <Modal title="Mülkü Düzenle" onClose={() => setOpen(false)} maxWidthClassName="max-w-xl">
          <MulkForm
            propertyId={propertyId}
            onSuccess={() => {
              setOpen(false);
              onUpdated?.();
            }}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
