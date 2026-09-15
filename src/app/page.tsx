 "use client";
import { ArrowRight, BrainCircuit, Code2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import TechVisual from "@/components/TechVisual";
import ApplicationModal from "@/components/ApplicationModal";
import CourseDetail from "@/components/CourseDetail";
import { courses, roadmap, faqs } from "@/lib/data";
import type { Course } from "@/types";

export default function Home() {
  const [apply,setApply]=useState(false); const [selected,setSelected]=useState<Course|null>(null);
  const openApply=()=>{setSelected(null);setApply(true)};
  return <>
    <Navbar onApply={openApply}/>
    <main>

      <section className="section" id="admission"><div className="container"><div className="eyebrow">Admission</div><h2 className="h2">Nova Academy'ga <span className="accent">qanday kiriladi?</span></h2><div className="process">{[["01","Ariza topshiring"],["02","Admission suhbat"],["03","Darajangiz aniqlanadi"],["04","O‘qishni boshlang"]].map(x=><div className="card" key={x[0]}><div className="process-num">{x[0]}</div><h3>{x[1]}</h3></div>)}</div><button className="btn primary" style={{marginTop:25}} onClick={openApply}>Ariza topshirish →</button></div></section>

      <section className="section" id="faq"><div className="container"><div className="eyebrow">FAQ</div><h2 className="h2">Ko‘p beriladigan <span className="accent">savollar.</span></h2><div className="faq">{faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></div></section>
    </main>
    <footer className="footer"><div className="container footer-grid"><div><div className="logo">NOVA <span>ACADEMY</span></div><p>IT'dagi kelajagingiz shu yerdan boshlanadi.</p></div><div>Yo‘nalishlar · Karyera · FAQ · Ariza topshirish</div></div></footer>
    {selected && <CourseDetail course={selected} onClose={()=>setSelected(null)} onApply={openApply}/>}
    {apply && <ApplicationModal onClose={()=>setApply(false)}/>}
  </>;
}

function CourseCard({course,onClick}:{course:Course,onClick:()=>void}) {
 const Icon=course.icon==="shield"?ShieldCheck:course.icon==="brain"?BrainCircuit:Code2;
 return <button className="card" style={{textAlign:"left",color:"inherit"}} onClick={onClick}><div className="card-icon"><Icon size={21}/></div><div className="eyebrow" style={{marginTop:25}}>{course.number}</div><h3>{course.title}</h3><p className="muted">{course.description}</p><div className="tags">{course.technologies.map(t=><span className="tag" key={t}>{t}</span>)}</div><span className="card-link">Yo‘nalishni tanlash →</span></button>
}
