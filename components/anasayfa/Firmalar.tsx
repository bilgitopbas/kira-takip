import Image from "next/image";

const LOGOLAR = [
  { src: "/logo-ozgul.png", alt: "Özgül Trailer", g: 286, y: 99 },
  { src: "/logo-topbas-doktor.png", alt: "Opt. Dr. Mevlüt Topbaş", g: 325, y: 74 },
  { src: "/logo-bankon.png", alt: "Eğ Bankon", g: 302, y: 106 },
  { src: "/logo-balcilar.png", alt: "Balcılar Yem Sanayi", g: 297, y: 79 },
];

// Kayan şerit: kesintisiz döngü için liste dört kez yazılır; tekrarlar ekran okuyucudan gizli.
export default function Firmalar() {
  const tekrar = [0, 1, 2, 3];
  return (
    <section className="firmalar" aria-label="Güvenle Tercih Eden Firmalar">
      <p>Güvenle Tercih Eden Firmalar</p>
      <div className="serit">
        <div className="serit-ic">
          {tekrar.map((k) =>
            LOGOLAR.map((l) => (
              <Image
                key={`${k}-${l.src}`}
                src={l.src}
                alt={k === 0 ? l.alt : ""}
                aria-hidden={k === 0 ? undefined : true}
                width={l.g}
                height={l.y}
              />
            )),
          )}
        </div>
      </div>
    </section>
  );
}
