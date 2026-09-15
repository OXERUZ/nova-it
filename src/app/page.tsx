"use client";

import {
  ArrowRight,
  BrainCircuit,
  Code2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  BriefcaseBusiness,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

import Navbar from "@/components/Navbar";
import TechVisual from "@/components/TechVisual";
import ApplicationModal from "@/components/ApplicationModal";
import CourseDetail from "@/components/CourseDetail";
import { courses, faqs } from "@/lib/data";
import type { Course } from "@/types";

export default function Home() {
  const [apply, setApply] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);

  const openApply = () => {
    setSelected(null);
    setApply(true);
  };

  return (
    <>
      <Navbar onApply={openApply} />

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">
                <Sparkles size={14} />
                NOVA ACADEMY
              </div>

              <h1 className="hero-title">
                IT&apos;dagi kelajagingiz{" "}
                <span className="accent">shu yerdan</span> boshlanadi.
              </h1>

              <p className="hero-subtitle">
                Dasturlash, sun&apos;iy intellekt va professional
                kiberxavfsizlik bo&apos;yicha amaliy bilim va real loyihalar
                asosida rivojlaning.
              </p>

              <div className="hero-actions">
                <button className="btn primary" onClick={openApply}>
                  Ariza topshirish <ArrowRight size={18} />
                </button>

                <a className="btn secondary" href="#courses">
                  Yo&apos;nalishlarni ko&apos;rish
                </a>
              </div>

              <div className="hero-trust">
                <span>Amaliy ta&apos;lim</span>
                <span>Real loyihalar</span>
                <span>Professional mentorlar</span>
              </div>
            </div>

            <div>
              <TechVisual />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="section stats-section">
          <div className="container stats-grid">
            <div className="stat">
              <strong>3+</strong>
              <span>Asosiy IT yo&apos;nalish</span>
            </div>
            <div className="stat">
              <strong>100%</strong>
              <span>Amaliy yondashuv</span>
            </div>
            <div className="stat">
              <strong>Real</strong>
              <span>Loyihalar va portfolio</span>
            </div>
            <div className="stat">
              <strong>1:1</strong>
              <span>Mentorlik yondashuvi</span>
            </div>
          </div>
        </section>

        {/* COURSES */}
        <section className="section" id="courses">
          <div className="container">
            <div className="eyebrow">Yo&apos;nalishlar</div>

            <h2 className="h2">
              O&apos;zingizga mos{" "}
              <span className="accent">IT yo&apos;nalishini</span> tanlang.
            </h2>

            <p className="section-lead">
              Bugungi va ertangi texnologiyalar uchun kerak bo&apos;ladigan
              bilimlarni bosqichma-bosqich egallang.
            </p>

            <div className="cards-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.number}
                  course={course}
                  onClick={() => setSelected(course)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* WHY NOVA */}
        <section className="section" id="why">
          <div className="container">
            <div className="eyebrow">Nega Nova?</div>

            <h2 className="h2">
              Oddiy kurs emas.{" "}
              <span className="accent">Professional rivojlanish tizimi.</span>
            </h2>

            <div className="feature-grid">
              <Feature
                icon={<Target size={22} />}
                title="Amaliy ta&apos;lim"
                text="Nazariyani real vazifalar, laboratoriyalar va loyihalar orqali mustahkamlaysiz."
              />

              <Feature
                icon={<Users size={22} />}
                title="Mentorlik"
                text="Savollaringizga yo&apos;l-yo&apos;riq beradigan va rivojlanishingizni kuzatadigan mentorlar."
              />

              <Feature
                icon={<BriefcaseBusiness size={22} />}
                title="Portfolio"
                text="O&apos;rganilgan bilimlarni real loyihalarda qo&apos;llab, professional portfolio shakllantirasiz."
              />

              <Feature
                icon={<GraduationCap size={22} />}
                title="Bosqichma-bosqich"
                text="Boshlang&apos;ich darajadan professional darajagacha aniq roadmap asosida harakat qilasiz."
              />
            </div>
          </div>
        </section>

        {/* CYBERSECURITY */}
        <section className="section">
          <div className="container">
            <div className="roadmap-box">
              <div className="roadmap-content">
                <div className="eyebrow">
                  <ShieldCheck size={15} />
                  CYBERSECURITY
                </div>

                <h2 className="h2">
                  Kiberxavfsizlikni{" "}
                  <span className="accent">professional darajada</span>{" "}
                  o&apos;rganing.
                </h2>

                <p className="section-lead">
                  Tarmoq, Linux, web xavfsizligi, penetration testing,
                  himoyalanish va real security amaliyotlari bilan ishlang.
                </p>

                <div className="check-list">
                  <CheckItem text="Network & Linux fundamentals" />
                  <CheckItem text="Web application security" />
                  <CheckItem text="Penetration testing" />
                  <CheckItem text="Defensive security" />
                </div>
              </div>

              <div className="roadmap-visual">
                <ShieldCheck size={90} strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>

        {/* AI */}
        <section className="section" id="ai">
          <div className="container">
            <div className="ai-box">
              <div>
                <div className="eyebrow">
                  <BrainCircuit size={15} />
                  ARTIFICIAL INTELLIGENCE
                </div>

                <h2 className="h2">
                  Sun&apos;iy intellekt bilan{" "}
                  <span className="accent">kelajakni yarating.</span>
                </h2>

                <p className="section-lead">
                  AI asoslari, zamonaviy vositalar va amaliy loyihalar orqali
                  yangi texnologiyalar bilan ishlashni o&apos;rganing.
                </p>
              </div>

              <BrainCircuit size={100} strokeWidth={1} />
            </div>
          </div>
        </section>

        {/* SYSTEM */}
        <section className="section" id="system">
          <div className="container">
            <div className="eyebrow">Learning System</div>

            <h2 className="h2">
              O&apos;qish jarayoni{" "}
              <span className="accent">qanday ishlaydi?</span>
            </h2>

            <div className="process">
              {[
                ["01", "Learn", "Fundamental bilimlarni o&apos;rganing."],
                ["02", "Practice", "Laboratoriya va amaliy topshiriqlarni bajaring."],
                ["03", "Build", "Real loyihalar orqali portfolio yarating."],
                ["04", "Grow", "Keyingi professional bosqichga o&apos;ting."],
              ].map(([number, title, text]) => (
                <div className="card" key={number}>
                  <div className="process-num">{number}</div>
                  <h3>{title}</h3>
                  <p className="muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CAREER */}
        <section className="section" id="career">
          <div className="container">
            <div className="career-box">
              <div>
                <div className="eyebrow">Career</div>

                <h2 className="h2">
                  Bilimni{" "}
                  <span className="accent">professional imkoniyatga</span>{" "}
                  aylantiring.
                </h2>

                <p className="section-lead">
                  Portfolio, amaliy tajriba va professional ko&apos;nikmalarni
                  rivojlantirish orqali IT karyerangiz uchun mustahkam asos
                  yarating.
                </p>

                <button className="btn primary" onClick={openApply}>
                  Boshlash <ArrowRight size={18} />
                </button>
              </div>

              <div className="career-icon">
                <BriefcaseBusiness size={90} strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>

        {/* ADMISSION */}
        <section className="section" id="admission">
          <div className="container">
            <div className="eyebrow">Admission</div>

            <h2 className="h2">
              Nova Academy&apos;ga{" "}
              <span className="accent">qanday kiriladi?</span>
            </h2>

            <div className="process">
              {[
                ["01", "Ariza topshiring"],
                ["02", "Admission suhbat"],
                ["03", "Darajangiz aniqlanadi"],
                ["04", "O&apos;qishni boshlang"],
              ].map(([number, title]) => (
                <div className="card" key={number}>
                  <div className="process-num">{number}</div>
                  <h3>{title}</h3>
                </div>
              ))}
            </div>

            <button
              className="btn primary"
              style={{ marginTop: 25 }}
              onClick={openApply}
            >
              Ariza topshirish <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq">
          <div className="container">
            <div className="eyebrow">FAQ</div>

            <h2 className="h2">
              Ko&apos;p beriladigan <span className="accent">savollar.</span>
            </h2>

            <div className="faq">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span>+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="logo">
              NOVA <span>ACADEMY</span>
            </div>
            <p>IT&apos;dagi kelajagingiz shu yerdan boshlanadi.</p>
          </div>

          <div>
            Yo&apos;nalishlar · Nega Nova? · Tizim · Karyera · FAQ · Ariza
            topshirish
          </div>
        </div>
      </footer>

      {selected && (
        <CourseDetail
          course={selected}
          onClose={() => setSelected(null)}
          onApply={openApply}
        />
      )}

      {apply && <ApplicationModal onClose={() => setApply(false)} />}
    </>
  );
}

function CourseCard({
  course,
  onClick,
}: {
  course: Course;
  onClick: () => void;
}) {
  const Icon =
    course.icon === "shield"
      ? ShieldCheck
      : course.icon === "brain"
        ? BrainCircuit
        : Code2;

  return (
    <button
      className="card"
      style={{ textAlign: "left", color: "inherit" }}
      onClick={onClick}
    >
      <div className="card-icon">
        <Icon size={21} />
      </div>

      <div className="eyebrow" style={{ marginTop: 25 }}>
        {course.number}
      </div>

      <h3>{course.title}</h3>

      <p className="muted">{course.description}</p>

      <div className="tags">
        {course.technologies.map((technology) => (
          <span className="tag" key={technology}>
            {technology}
          </span>
        ))}
      </div>

      <span className="card-link">Yo&apos;nalishni tanlash →</span>
    </button>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card feature-card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="check-item">
      <CheckCircle2 size={18} />
      <span>{text}</span>
    </div>
  );
}
