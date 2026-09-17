"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ArrowRight, Award, BarChart3, Bell, BookOpen, CalendarDays, CheckCircle2, Code2, Crown, FileText, Flame, Globe, GraduationCap, LayoutDashboard, Lock, LogIn, Menu, Palette, Play, Rocket, Search, ShieldCheck, Sparkles, Trophy, Users, X, Zap } from "lucide-react";

type AccessState = "checking" | "student" | "blocked";
type Module = { id: string; title: string; desc: string; icon: any; tag: string; href?: string; tone: string };

const modules: Module[] = [
  { id: "dashboard", title: "Student Dashboard 2.0", desc: "Shaxsiy profil, kurslar, progress, kunlik vazifalar va reyting.", icon: LayoutDashboard, tag: "CORE", href: "/dashboard", tone: "violet" },
  { id: "gamify", title: "XP & Achievements", desc: "XP, level, streak, badge va haftalik challenge'lar.", icon: Trophy, tag: "REWARDS", tone: "amber" },
  { id: "cyber", title: "Interactive Cyber Lab", desc: "Linux, network, log analysis va xavfsiz amaliy simulyatorlar.", icon: ShieldCheck, tag: "PRACTICE", tone: "cyan" },
  { id: "code", title: "NOVA Code Lab", desc: "HTML, CSS, JavaScript, Python va SQL mashqlari.", icon: Code2, tag: "PRACTICE", href: "/code-lab", tone: "blue" },
  { id: "analytics", title: "Learning Analytics", desc: "O‘zlashtirish, vaqt, kuchli va zaif mavzular tahlili.", icon: BarChart3, tag: "INSIGHTS", href: "/analytics", tone: "green" },
  { id: "cert", title: "Digital Certificates", desc: "Kurs yakunida raqamli sertifikat va verifikatsiya.", icon: Award, tag: "ACHIEVE", tone: "pink" },
  { id: "i18n", title: "Multi-language", desc: "O‘zbek, rus va ingliz tillari uchun til tanlash.", icon: Globe, tag: "ACCESS", tone: "indigo" },
  { id: "notify", title: "Realtime Notifications", desc: "Dars, topshiriq, mentor va jadval yangiliklari.", icon: Bell, tag: "LIVE", tone: "orange" },
  { id: "pwa", title: "NOVA PWA", desc: "Telefon ekraniga o‘rnatiladigan ilova tajribasi.", icon: Rocket, tag: "MOBILE", tone: "teal" },
  { id: "theme", title: "Theme Studio", desc: "Cyber Dark, Neon, Matrix va Light ko‘rinishlari.", icon: Palette, tag: "STYLE", tone: "purple" },
  { id: "mentor", title: "Mentor Cabinet", desc: "Feedback, davomat, baholar va guruh muloqoti.", icon: GraduationCap, tag: "MENTOR", tone: "rose" },
  { id: "community", title: "Student Community", desc: "Forum, guruh muhokamalari va savol-javoblar.", icon: Users, tag: "SOCIAL", tone: "sky" },
  { id: "schedule", title: "Smart Schedule", desc: "Darslar, vazifalar, imtihonlar va eslatmalar.", icon: CalendarDays, tag: "PLAN", href: "/schedule", tone: "lime" },
  { id: "resources", title: "Resource Library", desc: "PDF, video, prezentatsiyalar va saqlangan materiallar.", icon: BookOpen, tag: "LIBRARY", tone: "yellow" },
  { id: "career", title: "Career Center", desc: "CV, portfolio, GitHub va mock interview tayyorgarligi.", icon: Rocket, tag: "CAREER", tone: "red" },
  { id: "quizzes", title: "Interactive Quizzes", desc: "Vaqtli testlar, avtomatik natija va xatolar tahlili.", icon: FileText, tag: "ASSESSMENT", tone: "emerald" },
  { id: "security", title: "Security Center", desc: "2FA, qurilmalar, kirishlar tarixi va xavfsizlik nazorati.", icon: Lock, tag: "SECURITY", tone: "slate" },
];

export default function AcademyHub() {
  const router = useRouter();
  const supabase = createClient();
  const [access, setAccess] = useState<AccessState>("checking");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Module | null>(null);
  const [activeTheme, setActiveTheme] = useState("cyber");
  const [noticeCount, setNoticeCount] = useState(3);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setAccess("blocked"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (active) setAccess(profile?.role === "student" ? "student" : "blocked");
    })();
    return () => { active = false; };
  }, [supabase]);

  const filtered = useMemo(() => modules.filter(m => `${m.title} ${m.desc} ${m.tag}`.toLowerCase().includes(query.toLowerCase())), [query]);

  if (access === "checking") return <main className="nova-hub"><div className="hub-loading"><div className="nova-orb">N</div><p>Student access tekshirilmoqda...</p></div></main>;
  if (access === "blocked") return <main className="nova-hub"><div className="hub-gate-card"><div className="gate-lock"><Lock size={32}/></div><span className="hub-kicker">NOVA HUB · PRIVATE STUDENT SPACE</span><h1>Bu makon faqat <b>NOVA ACADEMY</b> o‘quvchilari uchun.</h1><p>NOVA HUB imkoniyatlaridan foydalanish uchun NOVA ACADEMY talabasi sifatida tizimga kiring. Ruxsatsiz foydalanuvchilar ushbu bo‘limga kira olmaydi.</p><div className="gate-actions"><button className="hub-primary" onClick={() => router.push("/login")}><LogIn size={17}/> Talaba sifatida kirish</button><button className="hub-secondary" onClick={() => router.push("/")}>Bosh sahifa <ArrowRight size={17}/></button></div></div></main>;

  return <main className={`nova-hub theme-${activeTheme}`}>
    <div className="hub-noise"/><div className="hub-grid"/>
    <header className="hub-topbar"><div className="brand-lockup"><div className="brand-mark">N</div><div><strong>NOVA<span>HUB</span></strong><small>ACADEMY OS</small></div></div><div className="topbar-status"><span className="status-dot"/> STUDENT ACCESS VERIFIED</div><button className="icon-button" onClick={() => setNoticeCount(0)} aria-label="Notifications"><Bell size={19}/>{noticeCount > 0 && <i>{noticeCount}</i>}</button></header>
    <section className="hub-hero"><div className="hero-copy"><div className="hub-kicker"><Sparkles size={14}/> YOUR LEARNING COMMAND CENTER</div><h1>Learn. <em>Build.</em><br/>Launch your future.</h1><p>Bilim, amaliyot va karyerangizni bitta aqlli ekotizimda boshqaring.</p><div className="hero-actions"><button className="hub-primary" onClick={() => router.push("/dashboard")}><Play size={16}/> O‘qishni davom ettirish</button><span className="hero-meta"><Flame size={17}/> 7 kunlik streak <b>+120 XP</b></span></div></div><div className="hero-widget"><div className="widget-top"><span>WEEKLY PROGRESS</span><Zap size={17}/></div><div className="progress-ring"><strong>68<span>%</span></strong><small>completed</small></div><div className="widget-bottom"><span>Current level</span><b>LEVEL 08</b></div><div className="xp-line"><span style={{width: "68%"}}/></div></div></section>
    <section className="hub-stats"><div><span><BookOpen size={17}/> Active courses</span><strong>04</strong><small>+1 this week</small></div><div><span><CheckCircle2 size={17}/> Completed tasks</span><strong>27</strong><small>82% success rate</small></div><div><span><Crown size={17}/> Total XP</span><strong>2,840</strong><small>Next level: 160 XP</small></div><div><span><CalendarDays size={17}/> Study time</span><strong>12.5h</strong><small>This week</small></div></section>
    <section className="hub-content"><div className="section-heading"><div><span className="hub-kicker">NOVA ECOSYSTEM</span><h2>All your tools, one hub.</h2><p>O‘zingizga kerakli modulni tanlang va o‘rganishni boshlang.</p></div><div className="hub-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Modul qidirish..."/></div></div><div className="module-grid">{filtered.map(m => { const Icon = m.icon; return <article className={`module-card tone-${m.tone}`} key={m.id}><div className="module-head"><div className="module-icon"><Icon size={22}/></div><span>{m.tag}</span></div><h3>{m.title}</h3><p>{m.desc}</p><button onClick={() => m.href ? router.push(m.href) : setSelected(m)}>{m.href ? "Ochish" : "Ko‘rish"} <ArrowRight size={15}/></button></article>; })}</div></section>
    <footer className="hub-footer"><span>© 2026 NOVA ACADEMY</span><span><ShieldCheck size={15}/> Private student environment</span><button onClick={() => router.push("/")}>Exit Hub <ArrowRight size={14}/></button></footer>
    {selected && <div className="hub-modal-backdrop" onClick={() => setSelected(null)}><div className="hub-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><X size={18}/></button><div className="modal-icon"><selected.icon size={27}/></div><span className="hub-kicker">{selected.tag} MODULE</span><h2>{selected.title}</h2><p>{selected.desc}</p><div className="modal-notice"><Sparkles size={17}/><span>Ushbu modul uchun interfeys tayyor. Real ma’lumotlar va ruxsatlar admin paneli hamda Supabase bilan ulanadi.</span></div><button className="hub-primary" onClick={() => setSelected(null)}>Tushunarli</button></div></div>}
  </main>;
}
