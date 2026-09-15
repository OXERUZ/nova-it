 "use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, LogOut, RefreshCw, Trash2, Save, LayoutDashboard, Users, BookOpen, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase";

type App = {id:string;application_number:string;full_name:string;phone:string;telegram:string|null;age:number|null;city:string|null;education:string|null;experience_level:string|null;course:string;study_format:string|null;goal:string|null;source:string|null;message:string|null;status:string;admin_note:string|null;created_at:string;updated_at:string};

const statusLabels:Record<string,string>={new:"Yangi",contacted:"Bog‘lanildi",interview:"Suhbat",accepted:"Qabul qilindi",rejected:"Rad etildi",studying:"O‘qimoqda",completed:"Tugatdi"};

export default function AdminPage(){
 const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null); const [session,setSession]=useState<any>(null); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [apps,setApps]=useState<App[]>([]); const [selected,setSelected]=useState<App|null>(null); const [q,setQ]=useState(""); const [status,setStatus]=useState(""); const [course,setCourse]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
 useEffect(()=>{
  const client = createClient();
  supabaseRef.current = client;

  client.auth.getSession().then(({data})=>{
    setSession(data.session);
    if(data.session) load();
  });
 },[]);
 async function load(){
  const supabase = supabaseRef.current;
  if(!supabase) return;

  setLoading(true);
  const {data,error}=await supabase.from("applications").select("*").order("created_at",{ascending:false});
  if(error)setError(error.message);
  setApps(data||[]);
  setLoading(false);
 }
 async function login(e:React.FormEvent){
  e.preventDefault();

  const supabase = supabaseRef.current;
  if(!supabase) return;

  setError("");
  const {data,error}=await supabase.auth.signInWithPassword({email,password});

  if(error)setError(error.message);
  else{
    setSession(data.session);
    load();
  }
 }
 async function logout(){
  const supabase = supabaseRef.current;
  if(!supabase) return;

  await supabase.auth.signOut();
  setSession(null);
 }
 async function update(){
  const supabase = supabaseRef.current;
  if(!supabase || !selected) return;

  const {data,error}=await supabase.from("applications").update({status:selected.status,admin_note:selected.admin_note}).eq("id",selected.id).select("*").single();

  if(error)setError(error.message);
  else{
    setApps(a=>a.map(x=>x.id===data.id?data:x));
    setSelected(data);
  }
 }
 async function remove(){
  const supabase = supabaseRef.current;
  if(!supabase || !selected) return;

  if(!confirm("Arizani o‘chirishni tasdiqlaysizmi?")) return;

  const {error}=await supabase.from("applications").delete().eq("id",selected.id);

  if(error)setError(error.message);
  else{
    setApps(a=>a.filter(x=>x.id!==selected.id));
    setSelected(null);
  }
 }
 const filtered=useMemo(()=>apps.filter(a=>(!q||[a.full_name,a.phone,a.telegram,a.application_number].join(" ").toLowerCase().includes(q.toLowerCase()))&&(!status||a.status===status)&&(!course||a.course===course)),[apps,q,status,course]);
 const counts=useMemo(()=>({all:apps.length,new:apps.filter(a=>a.status==="new").length,interview:apps.filter(a=>a.status==="interview").length,accepted:apps.filter(a=>a.status==="accepted").length,studying:apps.filter(a=>a.status==="studying").length}),[apps]);
 if(!session)return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}><form className="card" style={{width:"min(420px,100%)"}} onSubmit={login}><div className="logo">NOVA <span>ACADEMY</span></div><h2>Admin CRM</h2><p className="muted">Authenticated admin kirishi.</p><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><div className="field" style={{marginTop:12}}><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<p style={{color:"#ff7777"}}>{error}</p>}<button className="btn primary" style={{marginTop:18,width:"100%"}}>Kirish</button></form></div>;
 return <div style={{minHeight:"100vh"}}><header className="nav scrolled"><div className="container nav-inner"><div className="logo">NOVA <span>ACADEMY</span> / CRM</div><div style={{display:"flex",gap:8}}><button className="btn" onClick={load}><RefreshCw size={15}/></button><button className="btn" onClick={logout}><LogOut size={15}/> Chiqish</button></div></div></header>
 <main className="container" style={{paddingTop:115,paddingBottom:60}}><div className="eyebrow">Dashboard</div><h1 className="h2">Arizalar boshqaruvi.</h1>
 <div className="stats" style={{marginBottom:24}}>{[["Jami arizalar",counts.all],["Yangi",counts.new],["Suhbatdagi",counts.interview],["Qabul qilingan",counts.accepted],["O‘qiyotgan",counts.studying]].map(([x,n])=><div className="stat" key={x as string}><strong>{n as number}</strong><span>{x}</span></div>)}</div>
 <div className="card" style={{marginBottom:15}}><div style={{display:"grid",gridTemplateColumns:"1fr 180px 230px",gap:10}}><input className="field" style={{background:"#0c121b",border:"1px solid #202a38",color:"#fff",padding:12,borderRadius:10}} placeholder="Ism, telefon, Telegram yoki ID..." value={q} onChange={e=>setQ(e.target.value)}/><select value={status} onChange={e=>setStatus(e.target.value)} style={{background:"#0c121b",color:"#fff",border:"1px solid #202a38",borderRadius:10,padding:10}}><option value="">Barcha status</option>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select value={course} onChange={e=>setCourse(e.target.value)} style={{background:"#0c121b",color:"#fff",border:"1px solid #202a38",borderRadius:10,padding:10}}><option value="">Barcha yo‘nalish</option><option>Dasturlash</option><option>Sun’iy intellekt</option><option>Professional kiberxavfsizlik</option></select></div></div>
 <div className="card" style={{padding:0,overflow:"hidden"}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{["ID","O‘quvchi","Telefon","Yo‘nalish","Daraja","Status","Sana"].map(x=><th key={x} style={{textAlign:"left",padding:15,borderBottom:"1px solid #1a2230",color:"#8993a5"}}>{x}</th>)}</tr></thead><tbody>{filtered.map(a=><tr key={a.id} onClick={()=>setSelected(a)} style={{cursor:"pointer"}}><td style={{padding:15}}>{a.application_number}</td><td style={{padding:15}}><b>{a.full_name}</b><br/><span className="muted">{a.city||"—"}</span></td><td style={{padding:15}}>{a.phone}</td><td style={{padding:15}}>{a.course}</td><td style={{padding:15}}>{a.experience_level||"—"}</td><td style={{padding:15}}><span className="tag">{statusLabels[a.status]||a.status}</span></td><td style={{padding:15}}>{new Date(a.created_at).toLocaleDateString("uz-UZ")}</td></tr>)}{!filtered.length&&<tr><td colSpan={7} style={{padding:40,textAlign:"center",color:"#8993a5"}}>{loading?"Yuklanmoqda...":"Arizalar topilmadi."}</td></tr>}</tbody></table></div></div>
 </main>
 {selected&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><div className="eyebrow">{selected.application_number}</div><h2 style={{margin:"8px 0"}}>{selected.full_name}</h2><p className="muted">{selected.phone} · {selected.telegram||"Telegram yo‘q"}</p></div><button className="close" onClick={()=>setSelected(null)}>×</button></div>
 <div className="detail-list"><div><span className="muted">Yo‘nalish</span><br/><b>{selected.course}</b></div><div><span className="muted">Format</span><br/><b>{selected.study_format||"—"}</b></div><div><span className="muted">Ta’lim</span><br/><b>{selected.education||"—"}</b></div><div><span className="muted">Daraja</span><br/><b>{selected.experience_level||"—"}</b></div><div><span className="muted">Shahar</span><br/><b>{selected.city||"—"}</b></div><div><span className="muted">Manba</span><br/><b>{selected.source||"—"}</b></div></div>
 <h3>Maqsad</h3><p className="muted">{selected.goal||"—"}</p><h3>Izoh</h3><p className="muted">{selected.message||"—"}</p>
 <div className="form-grid"><div className="field"><label>Status</label><select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="field"><label>Admin note</label><input value={selected.admin_note||""} onChange={e=>setSelected({...selected,admin_note:e.target.value})}/></div></div>
 {error&&<p style={{color:"#ff7777"}}>{error}</p>}<div className="form-actions"><button className="btn" onClick={remove}><Trash2 size={15}/> O‘chirish</button><button className="btn primary" onClick={update}><Save size={15}/> Saqlash</button></div>
 </div></div>}
 </div>
}
