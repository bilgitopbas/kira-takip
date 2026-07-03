"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  {
    value: 95,
    suffix: "%",
    label: "Kira Geliri Artışı",
    desc: "Mevcut sözleşmeler ve piyasa koşulları dikkate alınarak kira gelirlerinin etkin ve sürdürülebilir şekilde artırılması hedeflenir.",
    dark: false,
  },
  {
    value: 250,
    suffix: "+",
    label: "Taşınmaz",
    desc: "Farklı nitelik ve ölçekteki taşınmazlar, tek bir sistem üzerinden düzenli ve kontrollü biçimde yönetilmektedir.",
    dark: true,
  },
  {
    value: 99,
    suffix: "%",
    label: "Memnuniyet",
    desc: "Şeffaf süreç yönetimi, düzenli takip ve güvene dayalı hizmet anlayışıyla yüksek memnuniyet sağlanmaktadır.",
    dark: false,
  },
  {
    value: 96,
    suffix: "%",
    label: "Düzenli Ödeme Takibi",
    desc: "Kira ödemeleri anlık bildirimlerle kontrol altında tutulur.",
    dark: true,
  },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let count = 0;
          const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
              setCurrent(target);
              clearInterval(timer);
            } else {
              setCurrent(Math.floor(count));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-5xl font-black tracking-tight">
      {current}{suffix}
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-[#17B6AE] bg-[#17B6AE]/10 px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
            Rakamlarla Mizan
          </span>
          <h2 className="text-4xl font-bold text-slate-800 leading-tight">
            Dijital mülk yönetiminde{" "}
            <span className="text-[#17B6AE]">ölçülebilir sonuçlar</span>
          </h2>
          <p className="text-slate-500 mt-3 text-base">
            Dijital mülk yönetiminde ölçülebilir sonuçlar ve net veriler.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                stat.dark
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-gray-100 text-slate-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  stat.dark ? "bg-[#17B6AE]" : "bg-[#17B6AE]/10"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${stat.dark ? "text-white" : "text-[#17B6AE]"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>

              <div className={stat.dark ? "text-white" : "text-[#17B6AE]"}>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>

              <div>
                <p className={`text-sm font-bold mb-1 ${stat.dark ? "text-white" : "text-slate-800"}`}>
                  {stat.label}
                </p>
                <p className={`text-xs leading-relaxed ${stat.dark ? "text-slate-400" : "text-slate-500"}`}>
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}