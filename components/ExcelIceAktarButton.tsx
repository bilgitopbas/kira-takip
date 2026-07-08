"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function ExcelIceAktarButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Excel ile İçe Aktar
      </button>
      {open && (
        <Modal title="Excel ile İçe Aktar" onClose={() => setOpen(false)} maxWidthClassName="max-w-md">
          <div className="text-center py-4">
            <p className="text-sm text-slate-600 mb-2">
              Excel dosyanızı yükleyin — mülk adı ve kiracı bilgisi sütunlarını otomatik okuyup
              mülklerinizi ve kiracılarınızı toplu olarak sisteme aktaracağız.
            </p>
            <p className="text-xs text-slate-400 mb-6">Bu özellik yakında eklenecek.</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              Anladım
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
