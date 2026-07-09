import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Kullanım Koşulları</h1>
        <p className="text-slate-500">İçerik yakında eklenecektir.</p>
      </div>
      <Footer />
    </div>
  );
}
