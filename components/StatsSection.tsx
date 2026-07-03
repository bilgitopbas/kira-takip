"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  {
    value: 95,
    suffix: "%",
    label: "Kira Geliri Artisi",
    desc: "Mevcut sozlesmeler ve piyasa kosullari dikkate alinarak kira gelirlerinin etkin ve surdurulebilir sekilde artirilmasi hedeflenir.",
    color: "from-[#17B6AE] to-[#0d8b84]",
  },
  {
    value: 250,
    suffix: "+",
    label: "Tasinmaz",
    desc: "Farkli nitelik ve olcekteki tasinmazlar, tek bir sistem uzerinden duzenli ve kontrollu bicimde yonetilmektedir.",
    color: "from-slate-700 to-slate-900",
  },
  {
    value: 99,
    suffix: "%",
    label: "Memnuniyet",
    desc: "Seffaf surec yonetimi, duzenli takip ve guvene dayali hizmet anlayisiyla yuksek memnuniyet saglanmaktadir.",
    color: "from-[#17B6AE] to-[#0d8b84]",
  },
  {
    value: 96,
    suffix: "%",
    label: "Duzenli Odeme Takibi",
    desc: "Kira odemeleri anlik bildirimlerle kontrol altinda tutulur.",
    color: "from-slate-700 to-slate-900",
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
            Dijital mulk yonetiminde<br />
            <span className="text-[#17B6AE]">olculebilir sonuclar</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} items-center justify-center mb-6 shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>

              <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              
              <p className="text-sm font-bold text-slate-700 mt-2 mb-3">{stat.label}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{stat.desc}</p>

              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${stat.color} transition-all duration-700 rounded-b-3xl`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}