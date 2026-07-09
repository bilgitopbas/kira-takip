"use client";

import { useRef, useState } from "react";
import Modal from "@/components/Modal";
import { parseRows, PROPERTY_TYPE_LABELS, EXPECTED_COLUMNS, type ImportRow } from "@/lib/excelImport";

type Step = "intro" | "preview" | "importing" | "result";
type RowResult = { row: ImportRow; propertyOk: boolean; tenantOk: boolean; error?: string };

export default function ExcelIceAktarButton({ className, onComplete }: { className?: string; onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [dragActive, setDragActive] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importResults, setImportResults] = useState<RowResult[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("intro");
    setRows([]);
    setParseError("");
    setImportResults([]);
    setProgress(0);
    setDragActive(false);
  }

  function closeModal() {
    setOpen(false);
    reset();
  }

  async function handleFile(file: File) {
    setParseError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const asArray: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      if (asArray.length < 2) {
        setParseError("Excel dosyasında başlık satırı ve en az bir veri satırı bulunmalı.");
        return;
      }

      const [headerRow, ...dataRows] = asArray;
      const parsed = parseRows(headerRow, dataRows);

      if (parsed.length === 0) {
        setParseError("İçe aktarılacak veri bulunamadı.");
        return;
      }

      setRows(parsed);
      setStep("preview");
    } catch (err) {
      console.error(err);
      setParseError("Dosya okunamadı. Lütfen .xlsx veya .csv formatında bir dosya yükleyin.");
    }
  }

  function updateRow(id: string, field: keyof ImportRow, value: string | boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleImportAll() {
    setStep("importing");
    const results: RowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let propertyOk = false;
      let tenantOk = false;
      let error: string | undefined;

      try {
        const propRes = await fetch("/api/dashboard/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: row.title,
            address: row.address,
            city: row.city || undefined,
            district: row.district || undefined,
            propertyType: row.propertyType || undefined,
            notes: row.notes || undefined,
            isOccupied: row.isOccupied,
          }),
        });
        const propData = await propRes.json();

        if (!propRes.ok) {
          error = propData.error || "Mülk oluşturulamadı.";
          results.push({ row, propertyOk, tenantOk, error });
          setProgress(i + 1);
          continue;
        }
        propertyOk = true;
        const propertyId = propData.property.id;

        if (row.tenantName) {
          const fd = new FormData();
          fd.append("propertyId", propertyId);
          fd.append("fullName", row.tenantName);
          fd.append("phone", row.phone);
          fd.append("nationalId", row.nationalId);
          fd.append("notificationAddress", row.notificationAddress);
          fd.append("monthlyRent", row.monthlyRent);
          fd.append("contractStart", row.contractStart);
          fd.append("paymentFrequency", row.paymentFrequency);
          if (row.increaseRate) {
            fd.append("increaseType", "CUSTOM");
            fd.append("increaseRate", row.increaseRate);
          }
          fd.append("depositAmount", row.depositAmount);

          const tenantRes = await fetch("/api/dashboard/tenants", { method: "POST", body: fd });
          const tenantData = await tenantRes.json();
          if (!tenantRes.ok) {
            error = tenantData.error || "Kiracı oluşturulamadı.";
          } else {
            tenantOk = true;
          }
        }
      } catch {
        error = "Beklenmeyen bir hata oluştu.";
      }

      results.push({ row, propertyOk, tenantOk, error });
      setProgress(i + 1);
    }

    setImportResults(results);
    setStep("result");
    onComplete?.();
  }

  const successCount = importResults.filter((r) => r.propertyOk).length;
  const tenantCount = importResults.filter((r) => r.tenantOk).length;
  const errorCount = importResults.filter((r) => r.error).length;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Excel ile İçe Aktar
      </button>

      {open && (
        <Modal
          title="Excel ile İçe Aktar"
          onClose={closeModal}
          maxWidthClassName={step === "preview" ? "max-w-6xl" : "max-w-lg"}
        >
          {step === "intro" && (
            <div>
              <div className="bg-[#17B6AE]/8 border border-[#17B6AE]/20 rounded-xl px-4 py-3 mb-5 text-sm text-slate-700">
                <p className="mb-2">
                  Excel dosyanızdaki sütun başlıkları aşağıdaki isimlerle eşleşirse otomatik olarak okunur ve her
                  satırdan hem bir <strong>mülk</strong> hem de (varsa) o mülkün <strong>kiracısı</strong>{" "}
                  oluşturulur. Aylık kira bedeli ve sözleşme başlangıç tarihi girilmişse kiracı otomatik olarak
                  borçlandırılır.
                </p>
                <p className="text-xs text-slate-500">Beklenen sütun başlıkları:</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {EXPECTED_COLUMNS.map((c) => (
                    <span key={c} className="text-[11px] bg-white border border-gray-200 rounded-md px-2 py-1 text-slate-600">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragActive ? "border-[#17B6AE] bg-[#17B6AE]/5" : "border-gray-200 hover:border-[#17B6AE]/50"
                }`}
              >
                <svg className="w-9 h-9 text-[#17B6AE] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                </svg>
                <p className="text-sm font-semibold text-slate-700">Excel dosyanızı buraya sürükleyin</p>
                <p className="text-xs text-slate-400 mt-1">veya tıklayıp dosya seçin — .xlsx, .xls, .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {parseError && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {parseError}
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                {rows.length} satır bulundu. Eksik veya hatalı hücreleri düzenleyip onaylayın. Boş bırakılan
                &quot;Mülk Adı&quot; veya &quot;Adres&quot; alanları o satırın içe aktarılmasını engeller.
              </p>
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Mülk Adı", "Tip", "Durum", "Şehir", "İlçe", "Adres", "Ad Soyad", "Telefon", "Kira Bedeli", "Sözleşme Başl.", "Ödeme Şekli", "Artış Oranı", "Depozito", ""].map((h) => (
                        <th key={h} className="px-2 py-2 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-1 py-1">
                          <input
                            value={row.title}
                            onChange={(e) => updateRow(row.id, "title", e.target.value)}
                            className={`w-32 px-2 py-1.5 text-xs border rounded-lg ${!row.title ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <select
                            value={row.propertyType}
                            onChange={(e) => updateRow(row.id, "propertyType", e.target.value)}
                            className="w-24 px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                          >
                            <option value="">—</option>
                            {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <select
                            value={row.isOccupied ? "1" : "0"}
                            onChange={(e) => updateRow(row.id, "isOccupied", e.target.value === "1")}
                            className="w-20 px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                          >
                            <option value="0">Boş</option>
                            <option value="1">Dolu</option>
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.city} onChange={(e) => updateRow(row.id, "city", e.target.value)} className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.district} onChange={(e) => updateRow(row.id, "district", e.target.value)} className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            value={row.address}
                            onChange={(e) => updateRow(row.id, "address", e.target.value)}
                            className={`w-32 px-2 py-1.5 text-xs border rounded-lg ${!row.address ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.tenantName} onChange={(e) => updateRow(row.id, "tenantName", e.target.value)} className="w-28 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.phone} onChange={(e) => updateRow(row.id, "phone", e.target.value)} className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <input
                            value={row.monthlyRent}
                            onChange={(e) => updateRow(row.id, "monthlyRent", e.target.value)}
                            className={`w-20 px-2 py-1.5 text-xs border rounded-lg ${row.tenantName && !row.monthlyRent ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input type="date" value={row.contractStart} onChange={(e) => updateRow(row.id, "contractStart", e.target.value)} className="w-32 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <select
                            value={row.paymentFrequency}
                            onChange={(e) => updateRow(row.id, "paymentFrequency", e.target.value)}
                            className="w-20 px-1.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                          >
                            <option value="">—</option>
                            <option value="MONTHLY">Aylık</option>
                            <option value="YEARLY">Yıllık</option>
                          </select>
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.increaseRate} onChange={(e) => updateRow(row.id, "increaseRate", e.target.value)} className="w-16 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <input value={row.depositAmount} onChange={(e) => updateRow(row.id, "depositAmount", e.target.value)} className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        </td>
                        <td className="px-1 py-1">
                          <button type="button" onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 px-1" title="Satırı kaldır">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-5">
                <button type="button" onClick={reset} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                  ← Farklı dosya seç
                </button>
                <button
                  type="button"
                  onClick={handleImportAll}
                  disabled={rows.length === 0}
                  className="bg-[#17B6AE] hover:bg-[#149891] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
                >
                  Onayla ve İçe Aktar ({rows.length} satır)
                </button>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#17B6AE] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-600">İçe aktarılıyor... {progress} / {rows.length}</p>
              <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#17B6AE] transition-all" style={{ width: `${(progress / Math.max(rows.length, 1)) * 100}%` }} />
              </div>
            </div>
          )}

          {step === "result" && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
                  <p className="text-xs text-emerald-600 font-medium">Mülk Eklendi</p>
                </div>
                <div className="bg-[#17B6AE]/8 border border-[#17B6AE]/20 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-[#17B6AE]">{tenantCount}</p>
                  <p className="text-xs text-[#17B6AE] font-medium">Kiracı Eklendi</p>
                </div>
                <div className={`rounded-xl px-4 py-3 text-center border ${errorCount > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                  <p className={`text-2xl font-bold ${errorCount > 0 ? "text-red-500" : "text-slate-400"}`}>{errorCount}</p>
                  <p className={`text-xs font-medium ${errorCount > 0 ? "text-red-500" : "text-slate-400"}`}>Hatalı Satır</p>
                </div>
              </div>

              {errorCount > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 mb-5">
                  {importResults.filter((r) => r.error).map((r, i) => (
                    <div key={i} className="px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700">{r.row.title || "(başlıksız satır)"}</span>{" "}
                      <span className="text-red-500">— {r.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="w-full bg-[#17B6AE] hover:bg-[#149891] text-white font-semibold py-3 rounded-xl transition text-sm"
              >
                Kapat
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
