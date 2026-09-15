"use client";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar({ onApply }: { onApply: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn(); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = [["Bosh sahifa","hero"],["Yo‘nalishlar","courses"],["Nega Nova?","why"],["Tizim","system"],["Karyera","career"],["FAQ","faq"]];
  return <header className={`nav ${scrolled ? "scrolled":""}`}>
    <div className="container nav-inner">
      <a className="logo" href="#hero">NOVA <span>ACADEMY</span></a>
      <nav className={`nav-links ${open ? "open":""}`}>
        {links.map(([label,id]) => <a key={id} href={`#${id}`} onClick={()=>setOpen(false)}>{label}</a>)}
        <button className="btn primary" onClick={()=>{setOpen(false);onApply()}}>Ariza topshirish</button>
      </nav>
      <button className="menu" aria-label="Menyu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
  </header>;
}
