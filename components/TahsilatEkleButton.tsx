"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import TahsilatForm from "@/components/forms/TahsilatForm";

export default function TahsilatEkleButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Tahsilat Ekle
      </button>
      {open && (
        <Modal title="Tahsilat Ekle" onClose={() => setOpen(false)} maxWidthClassName="max-w-xl">
          <TahsilatForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
