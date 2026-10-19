import { notFound } from "next/navigation";
import BinalarimEditor from "@/components/binalarim/BinalarimEditor";
import type { BMulk } from "@/lib/binalarimModeli";

// YALNIZ YEREL GELİŞTİRME: Binalarım ekranını uydurma veriyle görmek için.
// Üretimde 404. Dal main'e birleşmeden önce SİLİNECEK.
const m = (id: string, title: string, ek: Partial<BMulk> = {}): BMulk => ({
  id, title, address: "Örnek Mah.", city: "Konya", district: "Selçuklu", propertyType: "OFIS", buildingId: null, block: null, unitNo: null, ...ek,
});

const MULKLER: BMulk[] = [
  m("1", "Örnektepe A No:10"),
  m("2", "Örnektepe 2A No:5"),
  m("3", "ÖRNEKTEPE 2A / 75"),
  m("4", "Örnektepe B No:7"),
  m("5", "Örnektepe A NO:102-103"),
  m("6", "Örnektepe Plaza Daire 4"),
  m("7", "Gül Apt. No:1", { buildingId: "b1", unitNo: "1", propertyType: "KONUT" }),
  m("8", "Gül Apt. No:2", { buildingId: "b1", unitNo: "2", propertyType: "KONUT" }),
  m("9", "ÖRNEK SAN. 1M-1N", { city: "", district: "" }),
];

export default function GelistirmeBinalarim() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 py-6">
      <p className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Geliştirme önizlemesi — uydurma veri; kayıt veritabanı olmadığı için hata verir.
      </p>
      <BinalarimEditor
        mulkler={MULKLER}
        binalar={[{ id: "b1", name: "Gül Apartmanı", city: "Konya", district: "Meram", lat: 37.84, lng: 32.43, locationVerified: true }]}
      />
    </div>
  );
}
