"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck, ClipboardList, CreditCard, DollarSign, Filter, LayoutDashboard, LogOut, Plus, RefreshCw, Search, Settings2, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Tab = "overview"|"students"|"groups"|"courses"|"attendance"|"payments"|"leads"|"staff"|"schedule"|"reports"|"access";
type Student = { id:string; full_name:string; email:string|null; phone:string|null; role:string; rating_points:number; status:string; city:string|null; birth_date:string|null; address:string|null; started_at:string|null; notes:string|null; avatar_url:string|null };
type Group = { id:string; name:string; course:string; level:string; capacity:number; active:boolean };
type Course = { id:string; name:string; code:string|null; duration_months:number; price:number; active:boolean };
type Lead = { id:string; application_number:string; full_name:string; email:string|null; phone:string; course:string; status:string; created_at:string; admin_note:string|null };
type Payment = { id:string; student_id:string; amount:number; payment_date:string; method:string; status:string; receipt_no:string|null; note:string|null; student?:{full_name:string}[]|null };
type Attendance = { id:string; student_id:string; group_id:string|null; attendance_date:string; status:string; note:string|null; student?:{full_name:string}[]|null };
type Enrollment = { id:string; student_id:string; group_id:string|null; course_id:string|null; status:string };

const supabase=createClient();
const roles=["student","mentor","manager","admin","super_admin"];
const leadStatuses={new:"Yangi",contacted:"Bog‘lanildi",interview:"Suhbat",accepted:"Qabul qilindi",rejected:"Rad etildi",studying:"O‘qimoqda",completed:"Tugatdi"};

export default function Admin(){
 const router=useRouter(); const [session,setSession]=useState<any>(null); const [checking,setChecking]=useState(true); const [tab,setTab]=useState<Tab>("overview"); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 const [students,setStudents]=useState<Student[]>([]); const [groups,setGroups]=useState<Group[]>([]); const [courses,setCourses]=useState<Course[]>([]); const [leads,setLeads]=useState<Lead[]>([]); const [payments,setPayments]=useState<Payment[]>([]); const [attendance,setAttendance]=useState<Attendance[]>([]); const [enrollments,setEnrollments]=useState<Enrollment[]>([]); const [staff,setStaff]=useState<Student[]>([]); const [events,setEvents]=useState<any[]>([]); const [query,setQuery]=useState("");
 const [selected,setSelected]=useState<Student|null>(null); const [showStudent,setShowStudent]=useState(false); const [showCreate,setShowCreate]=useState(false); const [showGroup,setShowGroup]=useState(false); const [showCourse,setShowCourse]=useState(false); const [showPayment,setShowPayment]=useState(false); const [showAttendance,setShowAttendance]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(async({data})=>{if(!data.session){setChecking(false);return}const {data:isAdmin}=await supabase.rpc("is_admin");if(!isAdmin){await supabase.auth.signOut();setError("Bu hisob CRM huquqiga ega emas.");setChecking(false);return}setSession(data.session);await load();setChecking(false)})},[]);
 async function load(){setLoading(true);setError(""); const [s,g,c,l,p,att,en,st,e]=await Promise.all([
  supabase.from("profiles").select("id,full_name,email,phone,role,rating_points,status,city,birth_date,address,started_at,notes,avatar_url").order("created_at",{ascending:false}),
  supabase.from("groups").select("*").order("created_at",{ascending:false}),supabase.from("courses").select("*").order("created_at",{ascending:false}),
  supabase.from("applications").select("id,application_number,full_name,email,phone,course,status,created_at,admin_note").order("created_at",{ascending:false}),
  supabase.from("payments").select("id,student_id,course_id,amount,payment_date,method,status,receipt_no,note,student:profiles!payments_student_id_fkey(full_name),course:courses!payments_course_id_fkey(name)").order("payment_date",{ascending:false}).limit(200),
  supabase.from("attendance").select("id,student_id,group_id,attendance_date,status,note,student:profiles!attendance_student_id_fkey(full_name)").order("attendance_date",{ascending:false}).limit(200),
  supabase.from("enrollments").select("id,student_id,group_id,course_id,status").eq("status","active"),
  supabase.from("profiles").select("id,full_name,email,phone,role,rating_points,status,city,birth_date,address,started_at,notes,avatar_url").in("role",["mentor","manager","admin","super_admin"]),
  supabase.from("schedule_events").select("*,group:groups!schedule_events_group_id_fkey(name),mentor:profiles!schedule_events_mentor_id_fkey(full_name)").order("starts_at",{ascending:true}).limit(100)
 ]); const errs=[s,g,c,l,p,att,en,st,e].find(x=>x.error); if(errs)setError(errs.error?.message||""); setStudents((s.data||[]).filter((x:any)=>x.role==="student")); setGroups(g.data||[]);setCourses(c.data||[]);setLeads(l.data||[]);setPayments(p.data||[]);setAttendance(att.data||[]);setEnrollments(en.data||[]);setStaff(st.data||[]);setEvents(e.data||[]);setLoading(false); }
 async function logout(){await supabase.auth.signOut();router.replace("/")}
 if(checking)return <div className="page-loader"><div className="loader-mark">N</div><span>CRM tekshirilmoqda...</span></div>;
 if(!session)return <main className="auth-page"><div className="auth-shell admin-login"><a href="/" className="logo auth-logo">NOVA <span>ACADEMY</span></a><div className="auth-card"><div className="auth-card-icon"><ShieldCheck/></div><div className="eyebrow">SECURE CRM ACCESS</div><h2>Admin CRM</h2><p className="muted">CRM'ga kirish uchun mavjud admin hisobingizdan foydalaning.</p><a className="btn primary btn-lg" style={{width:"100%",marginTop:18}} href="/login">Login sahifasiga o‘tish <ArrowUpRight size={16}/></a></div></div></main>;
 const newLeads=leads.filter(x=>x.status==="new").length; const month=new Date().toISOString().slice(0,7); const revenue=payments.filter(x=>x.status==="paid"&&x.payment_date.startsWith(month)).reduce((a,x)=>a+Number(x.amount),0); const debtors=0; const filtered=students.filter(s=>!query||`${s.full_name} ${s.phone||""} ${s.email||""} ${s.city||""}`.toLowerCase().includes(query.toLowerCase()));
 const nav:[Tab,string,any][]=[["overview","Dashboard",LayoutDashboard],["students","O‘quvchilar",Users],["groups","Guruhlar",Users],["courses","Kurslar",BookOpen],["attendance","Davomat",ClipboardCheck],["payments","To‘lovlar",CreditCard],["leads","Arizalar",ClipboardList],["staff","Mentorlar / xodimlar",ShieldCheck],["schedule","Jadval",CalendarDays],["reports","Hisobotlar",DollarSign],["access","RBAC / Ruxsatlar",Settings2]];
 return <main className="crm-page"><header className="crm-nav"><div className="crm-brand"><a className="logo" href="/">NOVA <span>ACADEMY</span></a><b>PRO CRM</b></div><div className="crm-actions"><span className="admin-online"><i/> Online</span><button className="icon-btn" onClick={load} disabled={loading}><RefreshCw size={16}/></button><button className="btn" onClick={logout}><LogOut size={15}/> Chiqish</button></div></header><div className="crm-layout"><aside className="crm-sidebar"><div className="side-label">NOVA MANAGEMENT</div>{nav.map(([id,label,Icon])=><button key={id} className={`side-link ${tab===id?"active":""}`} onClick={()=>setTab(id)}><Icon/><span>{label}</span>{id==="leads"&&newLeads>0?<em>{newLeads}</em>:<ChevronRight size={14}/>}</button>)}<div className="crm-sidebar-foot"><span>NOVA ACADEMY</span><small>Learning · CRM · Growth</small></div></aside><section className="crm-content">{error&&<div className="crm-alert">{error}<button onClick={()=>setError("")}><X size={15}/></button></div>}
 {tab==="overview"&&<Overview students={students} groups={groups} leads={leads} payments={payments} attendance={attendance} revenue={revenue} newLeads={newLeads} onStudents={()=>setTab("students")} onLeads={()=>setTab("leads")}/>} 
 {tab==="students"&&<Students students={filtered} query={query} setQuery={setQuery} onAdd={()=>setShowCreate(true)} onOpen={(s)=>{setSelected(s);setShowStudent(true)}}/>}
 {tab==="groups"&&<Groups groups={groups} students={students} courses={courses} enrollments={enrollments} onAdd={()=>setShowGroup(true)} onRefresh={load}/>} {tab==="courses"&&<Courses courses={courses} onAdd={()=>setShowCourse(true)}/>} {tab==="attendance"&&<AttendancePage rows={attendance} students={students} groups={groups} onAdd={()=>setShowAttendance(true)}/>} {tab==="payments"&&<PaymentsPage rows={payments} students={students} onAdd={()=>setShowPayment(true)}/>} {tab==="leads"&&<Leads leads={leads} groups={groups} onRefresh={load}/>} {tab==="staff"&&<Staff staff={staff}/>} {tab==="schedule"&&<Schedule events={events} groups={groups} staff={staff}/>} {tab==="reports"&&<Reports students={students} groups={groups} payments={payments} attendance={attendance}/>} {tab==="access"&&<Access staff={staff}/>}</section></div>{showCreate&&<CreateStudent courses={courses} groups={groups} onClose={()=>setShowCreate(false)} onSaved={async()=>{setShowCreate(false);await load()}}/>}{showStudent&&selected&&<StudentDrawer student={selected} groups={groups} courses={courses} onClose={()=>setShowStudent(false)} onSaved={async()=>{setShowStudent(false);await load()}}/>}{showGroup&&<CreateGroup courses={courses} onClose={()=>setShowGroup(false)} onSaved={async()=>{setShowGroup(false);await load()}}/>}{showCourse&&<CreateCourse onClose={()=>setShowCourse(false)} onSaved={async()=>{setShowCourse(false);await load()}}/>}{showPayment&&<CreatePayment students={students} courses={courses} onClose={()=>setShowPayment(false)} onSaved={async()=>{setShowPayment(false);await load()}}/>}{showAttendance&&<CreateAttendance students={students} groups={groups} onClose={()=>setShowAttendance(false)} onSaved={async()=>{setShowAttendance(false);await load()}}/>}</main>
}

function Head({eyebrow,title,sub,action}:{eyebrow:string;title:string;sub?:string;action?:React.ReactNode}){return <div className="crm-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{sub&&<p className="muted">{sub}</p>}</div>{action}</div>}
function Overview({students,groups,leads,payments,attendance,revenue,newLeads,onStudents,onLeads}:{students:Student[];groups:Group[];leads:Lead[];payments:Payment[];attendance:Attendance[];revenue:number;newLeads:number;onStudents:()=>void;onLeads:()=>void}){const present=attendance.filter(a=>a.status==="present").length;const attRate=attendance.length?Math.round(present/attendance.length*100):0;return <><Head eyebrow="COMMAND CENTER" title="Bugungi holat." sub="NOVA ACADEMY operatsiyalarini bitta professional markazdan boshqaring."/><div className="crm-metrics"><Metric label="Jami o‘quvchilar" value={students.length} icon={<Users/>}/><Metric label="Faol guruhlar" value={groups.filter(g=>g.active).length} icon={<BookOpen/>}/><Metric label="Yangi arizalar" value={newLeads} icon={<ClipboardList/>}/><Metric label="Oy tushumi" value={`${revenue.toLocaleString("uz-UZ")} so‘m`} icon={<DollarSign/>}/></div><div className="crm-grid-two"><div className="crm-panel"><PanelHead title="Admission pipeline" action={<button className="text-link" onClick={onLeads}>Barchasi <ArrowUpRight size={14}/></button>}/><div className="pipeline">{Object.entries(leadStatuses).map(([k,v])=><div key={k}><span>{v}</span><strong>{leads.filter(x=>x.status===k).length}</strong></div>)}</div></div><div className="crm-panel"><PanelHead title="Academy health"/><div className="health-grid"><MetricSmall label="Davomat" value={`${attRate}%`}/><MetricSmall label="To‘lovlar" value={payments.length}/><MetricSmall label="Guruhlar" value={groups.length}/><MetricSmall label="Studentlar" value={students.length}/></div></div></div><div className="crm-panel" style={{marginTop:12}}><PanelHead title="Tezkor amallar"/><div className="quick-actions"><button className="btn primary" onClick={onStudents}><UserPlus size={15}/> O‘quvchi boshqaruvi</button><button className="btn" onClick={onLeads}><ClipboardList size={15}/> Arizalarni ko‘rish</button></div></div></>}
function Metric({label,value,icon}:{label:string;value:any;icon:any}){return <div className="crm-metric"><div>{icon}</div><span>{label}</span><strong>{value}</strong></div>};function MetricSmall({label,value}:{label:string;value:any}){return <div className="health-item"><span>{label}</span><strong>{value}</strong></div>};function PanelHead({title,action}:{title:string;action?:React.ReactNode}){return <div className="panel-head"><div><div className="eyebrow">NOVA CRM</div><h3>{title}</h3></div>{action}</div>}
function Students({students,query,setQuery,onAdd,onOpen}:{students:Student[];query:string;setQuery:(v:string)=>void;onAdd:()=>void;onOpen:(s:Student)=>void}){return <><Head eyebrow="STUDENT MANAGEMENT" title="O‘quvchilar." sub="Har bir o‘quvchi uchun yagona CRM profil, kurs, guruh, davomat va to‘lov tarixini boshqaring." action={<button className="btn primary" onClick={onAdd}><Plus size={15}/> O‘quvchi qo‘shish</button>}/><div className="crm-panel filters"><div className="searchbox"><Search size={16}/><input placeholder="Ism, telefon, email, shahar..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="filter-info"><Filter size={14}/> {students.length} ta profil</span></div><div className="crm-panel table-panel"><div className="table-wrap"><table><thead><tr><th>O‘quvchi</th><th>Kontakt</th><th>Holat</th><th>Rating</th><th>Shahar</th><th></th></tr></thead><tbody>{students.map(s=><tr key={s.id} onClick={()=>onOpen(s)}><td><div className="student-cell"><div className="avatar">{s.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><b>{s.full_name}</b></div></td><td><b>{s.phone||"—"}</b><small>{s.email||"—"}</small></td><td><span className="status status-studying">{s.status||"active"}</span></td><td><strong className="xp">{s.rating_points} XP</strong></td><td>{s.city||"—"}</td><td><button className="small-action">Profil <ChevronRight size={14}/></button></td></tr>)}{!students.length&&<tr><td colSpan={6} className="empty-table">O‘quvchilar topilmadi.</td></tr>}</tbody></table></div></div></>}
function EditGroup({group,courses,onClose,onSaved}:{group:Group;courses:Course[];onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState(group.name);
 const [course,setCourse]=useState(group.course);
 const [level,setLevel]=useState(group.level);
 const [capacity,setCapacity]=useState(String(group.capacity));
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!name.trim()||!course){
   alert("Guruh nomi va kursni kiriting.");
   return;
  }

  const capacityNumber=Number(capacity);

  if(!Number.isFinite(capacityNumber)||capacityNumber<1){
   alert("Sig‘im kamida 1 bo‘lishi kerak.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"group_update",
     id:group.id,
     name:name.trim(),
     course,
     level,
     capacity:capacityNumber
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Guruhni yangilashda xatolik.");
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Guruhni tahrirlash" onClose={onClose}>

  <div className="eyebrow">GROUP MANAGEMENT</div>
  <h3>{group.name}</h3>

  <div className="drawer-grid">

   <FormInput
    label="Guruh nomi"
    value={name}
    onChange={setName}
   />

   <div className="field">
    <label>Kurs *</label>

    <select
     value={course}
     onChange={e=>setCourse(e.target.value)}
    >
     <option value="">Kursni tanlang</option>

     {courses
      .filter(c=>c.active!==false)
      .map(c=>
       <option key={c.id} value={c.name}>
        {c.name}
       </option>
      )}
    </select>
   </div>

   <div className="field">
    <label>Daraja *</label>

    <select
     value={level}
     onChange={e=>setLevel(e.target.value)}
    >
     <option value="Beginner">Beginner</option>
     <option value="Elementary">Elementary</option>
     <option value="Intermediate">Intermediate</option>
     <option value="Upper-Intermediate">Upper-Intermediate</option>
     <option value="Advanced">Advanced</option>
    </select>
   </div>

   <FormInput
    label="Sig‘im"
    type="number"
    value={capacity}
    onChange={setCapacity}
   />

  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Saqlanmoqda...":"O‘zgarishlarni saqlash"}
   <Check size={16}/>
  </button>

 </Modal>
}

function CreateGroup({courses,onClose,onSaved}:{courses:Course[];onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState("");
 const [course,setCourse]=useState("");
 const [level,setLevel]=useState("Beginner");
 const [capacity,setCapacity]=useState("20");
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!name.trim()||!course){
   alert("Guruh nomi va kursni kiriting.");
   return;
  }

  const capacityNumber=Number(capacity);

  if(!Number.isFinite(capacityNumber)||capacityNumber<1){
   alert("Sig‘im kamida 1 bo‘lishi kerak.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"group_create",
     name:name.trim(),
     course,
     level,
     capacity:capacityNumber
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Guruh yaratishda xatolik.");
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Yangi guruh" onClose={onClose}>

  <div className="eyebrow">GROUP MANAGEMENT</div>
  <h3>Yangi guruh yaratish</h3>

  <div className="drawer-grid">

   <FormInput
    label="Guruh nomi"
    value={name}
    onChange={setName}
    placeholder="Masalan: Python Pro 01"
   />

   <div className="field">
    <label>Kurs *</label>

    <select
     value={course}
     onChange={e=>setCourse(e.target.value)}
    >
     <option value="">Kursni tanlang</option>

     {courses
      .filter(c=>c.active!==false)
      .map(c=>
       <option key={c.id} value={c.name}>
        {c.name}
       </option>
      )}
    </select>
   </div>

   <div className="field">
    <label>Daraja *</label>

    <select
     value={level}
     onChange={e=>setLevel(e.target.value)}
    >
     <option value="Beginner">Beginner</option>
     <option value="Elementary">Elementary</option>
     <option value="Intermediate">Intermediate</option>
     <option value="Upper-Intermediate">Upper-Intermediate</option>
     <option value="Advanced">Advanced</option>
    </select>
   </div>

   <FormInput
    label="Sig‘im"
    type="number"
    value={capacity}
    onChange={setCapacity}
   />

  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Yaratilmoqda...":"Guruh yaratish"}
   <Check size={16}/>
  </button>

 </Modal>
}

function Groups({groups,students,courses,enrollments,onAdd,onRefresh}:{groups:Group[];students:Student[];courses:Course[];enrollments:Enrollment[];onAdd:()=>void;onRefresh:()=>void}){
 const [editing,setEditing]=useState<Group|null>(null);

 async function manage(body:any){
  const response=await fetch("/api/admin/manage",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify(body)
  });
  const result=await response.json();

  if(!response.ok){
   alert(result.error||"Amal bajarilmadi.");
   return;
  }

  setEditing(null);
  await onRefresh();
 }

 return <>
  <Head
   eyebrow="GROUP MANAGEMENT"
   title="Guruhlar."
   sub="Kurs, daraja, sig‘im va o‘quvchilar tarkibini boshqaring."
   action={<button className="btn primary" onClick={onAdd}><Plus size={15}/> Guruh yaratish</button>}
  />

  <div className="crm-card-grid">
   {groups.map(g=>{
    const count=enrollments.filter(
      e=>e.group_id===g.id && e.status==="active"
    ).length;

    return <div className="crm-panel group-card" key={g.id}>
     <div className="group-top">
      <span className="status status-new">
       {g.active?"ACTIVE":"PAUSED"}
      </span>
      <BookOpen size={17}/>
     </div>

     <h3>{g.name}</h3>
     <p>{g.course} · {g.level}</p>

     <div className="group-stats">
      <span>Sig‘im <b>{g.capacity}</b></span>
      <span>O‘quvchi <b>{count}</b></span>
     </div>

     <div className="lead-actions" style={{marginTop:16}}>
      <button className="small-action" onClick={()=>setEditing(g)}>
       <Settings2 size={14}/> Tahrirlash
      </button>

      {g.active&&
       <button
        className="small-action"
        onClick={()=>manage({action:"group_delete",id:g.id})}
       >
        <Trash2 size={14}/> Deaktivatsiya
       </button>
      }
     </div>
    </div>
   })}

   {!groups.length&&
    <div className="crm-panel">
     Guruhlar hali yo‘q.
    </div>
   }
  </div>

  {editing&&
   <EditGroup
    group={editing}
    courses={courses}
    onClose={()=>setEditing(null)}
    onSaved={async()=>{setEditing(null);await onRefresh()}}
   />
  }
 </>
}

function EditCourse({course,onClose,onSaved}:{course:Course;onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState(course.name);
 const [code,setCode]=useState(course.code||"");
 const [duration,setDuration]=useState(String(course.duration_months));
 const [price,setPrice]=useState(String(course.price));
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!name.trim()){
   alert("Kurs nomini kiriting.");
   return;
  }

  const durationNumber=Number(duration);
  const priceNumber=Number(price);

  if(!Number.isFinite(durationNumber)||durationNumber<1){
   alert("Davomiylik kamida 1 oy bo‘lishi kerak.");
   return;
  }

  if(!Number.isFinite(priceNumber)||priceNumber<0){
   alert("Kurs narxi noto‘g‘ri.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"course_update",
     id:course.id,
     name:name.trim(),
     code:code.trim()||null,
     duration_months:durationNumber,
     price:priceNumber
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Kursni yangilashda xatolik.");
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Kursni tahrirlash" onClose={onClose}>

  <div className="eyebrow">COURSE MANAGEMENT</div>
  <h3>{course.name}</h3>

  <div className="drawer-grid">

   <FormInput
    label="Kurs nomi"
    value={name}
    onChange={setName}
   />

   <FormInput
    label="Kurs kodi"
    value={code}
    onChange={setCode}
    placeholder="Masalan: PY-01"
   />

   <FormInput
    label="Davomiyligi (oy)"
    type="number"
    value={duration}
    onChange={setDuration}
   />

   <FormInput
    label="Narxi (so‘m)"
    type="number"
    value={price}
    onChange={setPrice}
   />

  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Saqlanmoqda...":"O‘zgarishlarni saqlash"}
   <Check size={16}/>
  </button>

 </Modal>
}

function CreateCourse({onClose,onSaved}:{onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState("");
 const [code,setCode]=useState("");
 const [duration,setDuration]=useState("6");
 const [price,setPrice]=useState("0");
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!name.trim()){
   alert("Kurs nomini kiriting.");
   return;
  }

  const durationNumber=Number(duration);
  const priceNumber=Number(price);

  if(!Number.isFinite(durationNumber)||durationNumber<1){
   alert("Davomiylik kamida 1 oy bo‘lishi kerak.");
   return;
  }

  if(!Number.isFinite(priceNumber)||priceNumber<0){
   alert("Kurs narxi noto‘g‘ri.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"course_create",
     name:name.trim(),
     code:code.trim()||null,
     duration_months:durationNumber,
     price:priceNumber
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Kurs yaratishda xatolik.");
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Yangi kurs" onClose={onClose}>

  <div className="eyebrow">COURSE MANAGEMENT</div>
  <h3>Yangi kurs yaratish</h3>

  <div className="drawer-grid">

   <FormInput
    label="Kurs nomi"
    value={name}
    onChange={setName}
    placeholder="Masalan: Professional Python"
   />

   <FormInput
    label="Kurs kodi"
    value={code}
    onChange={setCode}
    placeholder="PYTHON-PRO"
   />

   <FormInput
    label="Davomiyligi (oy)"
    type="number"
    value={duration}
    onChange={setDuration}
   />

   <FormInput
    label="Kurs narxi (so‘m)"
    type="number"
    value={price}
    onChange={setPrice}
    placeholder="1500000"
   />

  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Yaratilmoqda...":"Kurs yaratish"}
   <Check size={16}/>
  </button>

 </Modal>
}

function Courses({courses,onAdd}:{courses:Course[];onAdd:()=>void}){
 const [editing,setEditing]=useState<Course|null>(null);

 async function manage(body:any){
  const response=await fetch("/api/admin/manage",{
   method:"POST",
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify(body)
  });

  const result=await response.json();

  if(!response.ok){
   alert(result.error||"Amal bajarilmadi.");
   return;
  }

  setEditing(null);
  window.location.reload();
 }

 return <>
  <Head
   eyebrow="COURSE CATALOG"
   title="Kurslar."
   sub="Kurs katalogi, davomiylik va narxlarni boshqaring."
   action={
    <button className="btn primary" onClick={onAdd}>
     <Plus size={15}/> Kurs qo‘shish
    </button>
   }
  />

  <div className="crm-card-grid">
   {courses.map(c=>
    <div className="crm-panel group-card" key={c.id}>
     <div className="group-top">
      <span className="status status-new">
       {c.active?"ACTIVE":"INACTIVE"}
      </span>
      <BookOpen size={17}/>
     </div>

     <h3>{c.name}</h3>

     <p>
      {c.code||"NOVA"} · {c.duration_months} oy
     </p>

     <strong className="course-price">
      {Number(c.price).toLocaleString("uz-UZ")} so‘m
     </strong>

     <div className="lead-actions" style={{marginTop:16}}>
      <button className="small-action" onClick={()=>setEditing(c)}>
       <Settings2 size={14}/> Tahrirlash
      </button>

      {c.active&&
       <button
        className="small-action"
        onClick={()=>manage({action:"course_delete",id:c.id})}
       >
        <Trash2 size={14}/> Deaktivatsiya
       </button>
      }
     </div>
    </div>
   )}

   {!courses.length&&
    <div className="crm-panel">
     Kurslar hali yo‘q.
    </div>
   }
  </div>

  {editing&&
   <EditCourse
    course={editing}
    onClose={()=>setEditing(null)}
    onSaved={()=>window.location.reload()}
   />
  }
 </>
}

function CreateAttendance({students,groups,onClose,onSaved}:{students:Student[];groups:Group[];onClose:()=>void;onSaved:()=>void}){
 const [studentId,setStudentId]=useState("");
 const [groupId,setGroupId]=useState("");
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [status,setStatus]=useState("present");
 const [note,setNote]=useState("");
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!studentId){
   alert("O‘quvchini tanlang.");
   return;
  }

  if(!date){
   alert("Davomat sanasini kiriting.");
   return;
  }

  setSaving(true);

  try{
   const {error}=await supabase
    .from("attendance")
    .upsert({
     student_id:studentId,
     group_id:groupId||null,
     attendance_date:date,
     status,
     note:note.trim()||null
    },{
     onConflict:"student_id,attendance_date"
    });

   if(error){
    alert(error.message);
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Davomatni saqlashda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Davomat qo‘shish" onClose={onClose}>

  <div className="eyebrow">ATTENDANCE MANAGEMENT</div>
  <h3>Davomat qayd etish</h3>

  <div className="drawer-grid">

   <div className="field">
    <label>O‘quvchi *</label>

    <select
     value={studentId}
     onChange={e=>setStudentId(e.target.value)}
    >
     <option value="">O‘quvchini tanlang</option>

     {students
      .filter(s=>s.status!=="removed")
      .map(s=>
       <option key={s.id} value={s.id}>
        {s.full_name}
       </option>
      )}
    </select>
   </div>

   <div className="field">
    <label>Guruh</label>

    <select
     value={groupId}
     onChange={e=>setGroupId(e.target.value)}
    >
     <option value="">Guruhni tanlang</option>

     {groups
      .filter(g=>g.active!==false)
      .map(g=>
       <option key={g.id} value={g.id}>
        {g.name} — {g.course}
       </option>
      )}
    </select>
   </div>

   <FormInput
    label="Sana"
    type="date"
    value={date}
    onChange={setDate}
   />

   <div className="field">
    <label>Holati</label>

    <select
     value={status}
     onChange={e=>setStatus(e.target.value)}
    >
     <option value="present">Kelgan</option>
     <option value="absent">Kelmagan</option>
     <option value="late">Kechikkan</option>
     <option value="excused">Sababli</option>
    </select>
   </div>

  </div>

  <div className="field" style={{marginTop:14}}>
   <label>Izoh</label>

   <textarea
    value={note}
    onChange={e=>setNote(e.target.value)}
    placeholder="Davomat bo‘yicha izoh..."
   />
  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Saqlanmoqda...":"Davomatni saqlash"}
   <Check size={16}/>
  </button>

 </Modal>
}

function AttendancePage({rows,students,groups,onAdd}:{rows:Attendance[];students:Student[];groups:Group[];onAdd:()=>void}){return <><Head eyebrow="ATTENDANCE" title="Davomat." sub="Keldi, kelmadi, kechikdi yoki uzrli holatlarni tarix bilan saqlang." action={<button className="btn primary" onClick={onAdd}><Plus size={15}/> Davomat kiritish</button>}/><div className="crm-panel table-panel"><div className="table-wrap"><table><thead><tr><th>Sana</th><th>O‘quvchi</th><th>Holat</th><th>Izoh</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.attendance_date}</td><td><b>{(r as any).student?.full_name||students.find(s=>s.id===r.student_id)?.full_name||"—"}</b></td><td><span className={`status ${r.status==="present"?"status-studying":r.status==="late"?"status-new":"status-rejected"}`}>{r.status}</span></td><td>{r.note||"—"}</td></tr>)}</tbody></table></div></div></>}
function CreatePayment({students,courses,onClose,onSaved}:{students:Student[];courses:Course[];onClose:()=>void;onSaved:()=>void}){
 const [studentId,setStudentId]=useState("");
 const [courseId,setCourseId]=useState("");
 const [amount,setAmount]=useState("");
 const [paymentDate,setPaymentDate]=useState(new Date().toISOString().slice(0,10));
 const [method,setMethod]=useState("cash");
 const [status,setStatus]=useState("paid");
 const [receiptNo,setReceiptNo]=useState("");
 const [note,setNote]=useState("");
 const [saving,setSaving]=useState(false);

 async function save(){
  if(!studentId){
   alert("O‘quvchini tanlang.");
   return;
  }

  const amountNumber=Number(amount);

  if(!Number.isFinite(amountNumber)||amountNumber<=0){
   alert("To‘lov summasini kiriting.");
   return;
  }

  setSaving(true);

  try{
   const {error}=await supabase
    .from("payments")
    .insert({
     student_id:studentId,
     course_id:courseId||null,
     amount:amountNumber,
     payment_date:paymentDate,
     method,
     status,
     receipt_no:receiptNo.trim()||null,
     note:note.trim()||null
    });

   if(error){
    alert(error.message);
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"To‘lovni saqlashda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return <Modal title="Yangi to‘lov" onClose={onClose}>

  <div className="eyebrow">PAYMENT MANAGEMENT</div>
  <h3>To‘lov qo‘shish</h3>

  <div className="drawer-grid">

   <div className="field">
    <label>O‘quvchi *</label>

    <select
     value={studentId}
     onChange={e=>setStudentId(e.target.value)}
    >
     <option value="">O‘quvchini tanlang</option>

     {students
      .filter(s=>s.status!=="removed")
      .map(s=>
       <option key={s.id} value={s.id}>
        {s.full_name}{s.phone?` — ${s.phone}`:""}
       </option>
      )}
    </select>
   </div>

   <div className="field">
    <label>Kurs</label>

    <select
     value={courseId}
     onChange={e=>setCourseId(e.target.value)}
    >
     <option value="">Kursni tanlang</option>

     {courses
      .filter(c=>c.active!==false)
      .map(c=>
       <option key={c.id} value={c.id}>
        {c.name}
       </option>
      )}
    </select>
   </div>

   <FormInput
    label="Summa (so‘m)"
    type="number"
    value={amount}
    onChange={setAmount}
    placeholder="500000"
   />

   <FormInput
    label="To‘lov sanasi"
    type="date"
    value={paymentDate}
    onChange={setPaymentDate}
   />

   <div className="field">
    <label>To‘lov usuli</label>

    <select
     value={method}
     onChange={e=>setMethod(e.target.value)}
    >
     <option value="cash">Naqd</option>
     <option value="card">Karta</option>
     <option value="transfer">Bank o‘tkazmasi</option>
     <option value="online">Online</option>
     <option value="other">Boshqa</option>
    </select>
   </div>

   <div className="field">
    <label>Holati</label>

    <select
     value={status}
     onChange={e=>setStatus(e.target.value)}
    >
     <option value="paid">To‘langan</option>
     <option value="pending">Kutilmoqda</option>
     <option value="refunded">Qaytarilgan</option>
    </select>
   </div>

   <FormInput
    label="Chek raqami"
    value={receiptNo}
    onChange={setReceiptNo}
    placeholder="Ixtiyoriy"
   />

  </div>

  <div className="field" style={{marginTop:14}}>
   <label>Izoh</label>

   <textarea
    value={note}
    onChange={e=>setNote(e.target.value)}
    placeholder="To‘lov bo‘yicha izoh..."
   />
  </div>

  <button
   className="btn primary btn-lg"
   style={{width:"100%",marginTop:18}}
   onClick={save}
   disabled={saving}
  >
   {saving?"Saqlanmoqda...":"To‘lovni saqlash"}
   <Check size={16}/>
  </button>

 </Modal>
}

function PaymentsPage({rows,students,onAdd}:{rows:Payment[];students:Student[];onAdd:()=>void}){const total=rows.filter(x=>x.status==="paid").reduce((a,x)=>a+Number(x.amount),0);return <><Head eyebrow="FINANCE" title="To‘lovlar." sub="To‘lovlar, kvitansiyalar va moliyaviy tarixni boshqaring." action={<button className="btn primary" onClick={onAdd}><Plus size={15}/> To‘lov kiritish</button>}/><div className="crm-metrics"><Metric label="Jami tushum" value={`${total.toLocaleString("uz-UZ")} so‘m`} icon={<DollarSign/>}/><Metric label="Tranzaksiyalar" value={rows.length} icon={<CreditCard/>}/></div><div className="crm-panel table-panel" style={{marginTop:12}}><div className="table-wrap"><table><thead><tr><th>Sana</th><th>O‘quvchi</th><th>Summa</th><th>Usul</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.payment_date}</td><td>{(r as any).student?.full_name||students.find(s=>s.id===r.student_id)?.full_name||"—"}</td><td><strong>{Number(r.amount).toLocaleString("uz-UZ")} so‘m</strong></td><td>{r.method}</td><td><span className="status status-studying">{r.status}</span></td></tr>)}</tbody></table></div></div></>}
function Leads({leads,groups,onRefresh}:{leads:Lead[];groups:Group[];onRefresh:()=>void}){
 const [selected,setSelected]=useState<Lead|null>(null);

 async function update(id:string,status:string){
  const {error}=await supabase.from("applications").update({status}).eq("id",id);
  if(error) alert(error.message);
  else onRefresh();
 }

 return <>
  <Head eyebrow="ADMISSIONS / LEADS" title="Arizalar." sub="Lead → suhbat → qabul → o‘quvchi jarayonini boshqaring."/>

  <div className="crm-card-grid lead-grid">
   {leads.map(l=>
    <div className="crm-panel" key={l.id}>
     <div className="lead-head">
      <span className={`status status-${l.status}`}>
       {leadStatuses[l.status as keyof typeof leadStatuses]||l.status}
      </span>
      <span className="mono">{l.application_number}</span>
     </div>

     <h3>{l.full_name}</h3>
     <p>{l.phone} · {l.email||"email yo‘q"}</p>
     <small>{l.course}</small>

     <div className="lead-actions">
      <button className="small-action" onClick={()=>update(l.id,"contacted")}>
       Bog‘lanildi
      </button>

      <button className="small-action" onClick={()=>update(l.id,"interview")}>
       Suhbat
      </button>

      <button className="small-action" onClick={()=>setSelected(l)}>
       <Check size={14}/> O‘quvchi qabul qilish
      </button>

      <button className="small-action" onClick={()=>update(l.id,"rejected")}>
       Rad etish
      </button>
     </div>
    </div>
   )}
  </div>

  {selected&&
   <AcceptStudentModal
    application={selected}
    groups={groups}
    onClose={()=>setSelected(null)}
    onSaved={async()=>{
     setSelected(null);
     await onRefresh();
    }}
   />
  }
 </>
}

function AcceptStudentModal({
 application,
 groups,
 onClose,
 onSaved
}:{
 application:Lead;
 groups:Group[];
 onClose:()=>void;
 onSaved:()=>void;
}){
 const [groupId,setGroupId]=useState("");
 const [password,setPassword]=useState("");
 const [startedAt,setStartedAt]=useState(new Date().toISOString().slice(0,10));
 const [paymentAmount,setPaymentAmount]=useState("");
 const [paymentDate,setPaymentDate]=useState(new Date().toISOString().slice(0,10));
 const [paymentStatus,setPaymentStatus]=useState("paid");
 const [paymentMethod,setPaymentMethod]=useState("cash");
 const [paymentNote,setPaymentNote]=useState("");
 const [schedule,setSchedule]=useState<any[]>([]);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");

 const selectedGroup=groups.find((g:any)=>g.id===groupId);

 useEffect(()=>{
  if(!groupId){
   setSchedule([]);
   return;
  }

  supabase
   .from("schedule_events")
   .select("id,title,room,starts_at,ends_at,status,note")
   .eq("group_id",groupId)
   .order("starts_at",{ascending:true})
   .limit(20)
   .then(({data,error})=>{
    if(error){
     setError(error.message);
     return;
    }
    setSchedule(data||[]);
   });
 },[groupId]);

 async function accept(){
  setError("");

  if(!groupId){
   setError("Guruhni tanlang.");
   return;
  }

  if(!password||password.length<8){
   setError("Parol kamida 8 belgidan iborat bo‘lishi kerak.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/applications/accept",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     application_id:application.id,
     group_id:groupId,
     password,
     started_at:startedAt,
     payment_amount:Number(paymentAmount||0),
     payment_date:paymentDate,
     payment_status:paymentStatus,
     payment_method:paymentMethod,
     payment_note:paymentNote
    })
   });

   const result=await response.json();

   if(!response.ok){
    setError(result.error||"O‘quvchini qabul qilishda xatolik.");
    return;
   }

   alert(
    `O‘quvchi muvaffaqiyatli qabul qilindi.\n\nLogin: ${result.login}\nGuruh: ${result.group}`
   );

   await onSaved();
  }catch(e:any){
   setError(e?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 return(
  <div className="drawer-backdrop">
   <aside className="drawer">

    <div className="drawer-head">
     <div>
      <div className="eyebrow">ADMISSION / ACCEPT STUDENT</div>
      <h2>{application.full_name}</h2>
      <p>{application.phone} · {application.course}</p>
     </div>

     <button className="close" onClick={onClose}>
      <X/>
     </button>
    </div>

    <div className="drawer-body">

     <div className="crm-panel">
      <div className="eyebrow">STUDENT ACCESS</div>
      <h3>O‘quvchi login ma’lumotlari</h3>

      <div className="field">
       <label>Login / Telefon raqami</label>
       <input value={application.phone} readOnly/>
      </div>

      <div className="field" style={{marginTop:14}}>
       <label>Parol *</label>
       <input
        type="password"
        value={password}
        onChange={e=>setPassword(e.target.value)}
        placeholder="Admin o‘zi belgilaydi"
        minLength={8}
        required
       />
      </div>

      <small className="muted">
       Login o‘quvchining telefon raqami bo‘ladi.
      </small>
     </div>

     <div className="crm-panel" style={{marginTop:16}}>
      <div className="eyebrow">GROUP ASSIGNMENT</div>
      <h3>Guruhga biriktirish</h3>

      <div className="field">
       <label>Guruh *</label>

       <select
        value={groupId}
        onChange={e=>setGroupId(e.target.value)}
        required
       >
        <option value="">Guruhni tanlang</option>

        {groups
         .filter((g:any)=>g.active!==false)
         .map((g:any)=>
          <option key={g.id} value={g.id}>
           {g.name} — {g.course}
          </option>
         )}
       </select>
      </div>

      {selectedGroup&&
       <div className="drawer-grid" style={{marginTop:16}}>
        <div>
         <span>Kurs</span>
         <strong>{selectedGroup.course}</strong>
        </div>

        <div>
         <span>Daraja</span>
         <strong>{selectedGroup.level}</strong>
        </div>

        <div>
         <span>Sig‘im</span>
         <strong>{selectedGroup.capacity}</strong>
        </div>
       </div>
      }

      <div className="field" style={{marginTop:14}}>
       <label>O‘qishni boshlash sanasi</label>

       <input
        type="date"
        value={startedAt}
        onChange={e=>setStartedAt(e.target.value)}
       />
      </div>
     </div>

     <div className="crm-panel" style={{marginTop:16}}>
      <div className="eyebrow">CLASS SCHEDULE</div>
      <h3>Dars vaqtlari</h3>

      {!groupId&&
       <p className="muted">Avval guruhni tanlang.</p>
      }

      {groupId&&!schedule.length&&
       <p className="muted">
        Bu guruh uchun jadval hali kiritilmagan.
       </p>
      }

      {schedule.map(item=>
       <div key={item.id} className="history-row">
        <CalendarDays size={18}/>

        <div>
         <strong>{item.title}</strong>

         <span>
          {new Date(item.starts_at).toLocaleString("uz-UZ")}
          {" — "}
          {new Date(item.ends_at).toLocaleTimeString(
           "uz-UZ",
           {hour:"2-digit",minute:"2-digit"}
          )}
         </span>

         {item.room&&
          <span>Xona: {item.room}</span>
         }
        </div>
       </div>
      )}
     </div>

     <div className="crm-panel" style={{marginTop:16}}>
      <div className="eyebrow">PAYMENT</div>
      <h3>To‘lov ma’lumotlari</h3>

      <div className="drawer-grid">

       <div className="field">
        <label>To‘langan summa</label>
        <input
         type="number"
         min="0"
         value={paymentAmount}
         onChange={e=>setPaymentAmount(e.target.value)}
         placeholder="0"
        />
       </div>

       <div className="field">
        <label>To‘lov sanasi</label>
        <input
         type="date"
         value={paymentDate}
         onChange={e=>setPaymentDate(e.target.value)}
        />
       </div>

       <div className="field">
        <label>Holati</label>

        <select
         value={paymentStatus}
         onChange={e=>setPaymentStatus(e.target.value)}
        >
         <option value="paid">To‘langan</option>
         <option value="pending">Kutilmoqda</option>
         <option value="refunded">Qaytarilgan</option>
        </select>
       </div>

       <div className="field">
        <label>To‘lov usuli</label>

        <select
         value={paymentMethod}
         onChange={e=>setPaymentMethod(e.target.value)}
        >
         <option value="cash">Naqd</option>
         <option value="card">Karta</option>
         <option value="transfer">Bank o‘tkazmasi</option>
         <option value="online">Online</option>
         <option value="other">Boshqa</option>
        </select>
       </div>

      </div>

      <div className="field" style={{marginTop:14}}>
       <label>To‘lov izohi</label>

       <textarea
        value={paymentNote}
        onChange={e=>setPaymentNote(e.target.value)}
        placeholder="Masalan: sentabr oyi uchun..."
       />
      </div>
     </div>

     {error&&
      <div className="crm-alert" style={{marginTop:16}}>
       {error}
      </div>
     }

    </div>

    <div className="drawer-actions">
     <button className="btn" onClick={onClose} disabled={saving}>
      Bekor qilish
     </button>

     <button
      className="btn primary"
      onClick={accept}
      disabled={saving}
     >
      <Check size={16}/>
      {saving?"Qabul qilinmoqda...":"O‘QUVCHINI QABUL QILISH"}
     </button>
    </div>

   </aside>
  </div>
 )
}

function Staff({staff}:{staff:Student[]}){return <><Head eyebrow="PEOPLE" title="Mentorlar va xodimlar." sub="Xodim profili va CRM rollarini ko‘ring."/><div className="crm-card-grid">{staff.map(s=><div className="crm-panel group-card" key={s.id}><div className="student-cell"><div className="avatar">{s.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><h3>{s.full_name}</h3><p>{s.role}</p></div></div><div className="drawer-grid" style={{marginTop:18}}><div><span>Telefon</span><strong>{s.phone||"—"}</strong></div><div><span>Email</span><strong>{s.email||"—"}</strong></div></div></div>)}</div></>}
function Schedule({events}:{events:any[];groups:Group[];staff:Student[]}){return <><Head eyebrow="ACADEMIC CALENDAR" title="Jadval." sub="Guruh va mentor darslarini markazlashtirilgan kalendarda boshqaring."/><div className="crm-panel table-panel"><div className="table-wrap"><table><thead><tr><th>Vaqt</th><th>Dars</th><th>Guruh</th><th>Mentor</th><th>Xona</th><th>Status</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{new Date(e.starts_at).toLocaleString("uz-UZ")}</td><td><b>{e.title}</b></td><td>{e.group?.name||"—"}</td><td>{e.mentor?.full_name||"—"}</td><td>{e.room||"—"}</td><td>{e.status}</td></tr>)}</tbody></table></div></div></>}
function Reports({students,groups,payments,attendance}:{students:Student[];groups:Group[];payments:Payment[];attendance:Attendance[]}){const paid=payments.filter(p=>p.status==="paid").reduce((a,p)=>a+Number(p.amount),0);const present=attendance.filter(a=>a.status==="present").length;return <><Head eyebrow="ANALYTICS" title="Hisobotlar." sub="CRM ma’lumotlari asosida operatsion ko‘rsatkichlar."/><div className="crm-metrics"><Metric label="O‘quvchilar" value={students.length} icon={<Users/>}/><Metric label="Guruhlar" value={groups.length} icon={<BookOpen/>}/><Metric label="Tushum" value={`${paid.toLocaleString("uz-UZ")} so‘m`} icon={<DollarSign/>}/><Metric label="Davomat" value={attendance.length?`${Math.round(present/attendance.length*100)}%`:"0%"} icon={<ClipboardCheck/>}/></div><div className="crm-panel report-list"><div><span>Faol o‘quvchilar</span><strong>{students.filter(s=>s.status==="active").length}</strong></div><div><span>Faol guruhlar</span><strong>{groups.filter(g=>g.active).length}</strong></div><div><span>Paid tranzaksiyalar</span><strong>{payments.filter(p=>p.status==="paid").length}</strong></div></div></>}
function Access({staff}:{staff:Student[]}){return <><Head eyebrow="RBAC" title="Ruxsatlar." sub="Super Admin, Admin, Manager, Mentor va Student rollari."/><div className="crm-card-grid">{roles.map(r=><div className="crm-panel role-card" key={r}><ShieldCheck size={18}/><h3>{r}</h3><p>{r==="super_admin"?"To‘liq tizim nazorati":r==="admin"?"CRM va ma’lumotlar boshqaruvi":r==="manager"?"Operatsion boshqaruv":r==="mentor"?"Guruh va akademik jarayon": "Faqat o‘z profili va ta’lim ma’lumotlari"}</p></div>)}</div></>}

function FormInput({label,value,onChange,type="text",placeholder,required=false}:{label:string;value:string;onChange:(value:string)=>void;type?:string;placeholder?:string;required?:boolean}){
 return <div className="field">
  <label>{label}</label>
  <input
   type={type}
   value={value}
   onChange={e=>onChange(e.target.value)}
   placeholder={placeholder}
   required={required}
  />
 </div>
}

function FormSelect({label,value,options,onChange}:{label:string;value:string;options:[string,string][];onChange:(value:string)=>void}){
 return <div className="field">
  <label>{label}</label>
  <select
   value={value}
   onChange={e=>onChange(e.target.value)}
  >
   <option value="">Tanlang</option>
   {options.map(([optionValue,optionLabel])=>
    <option key={optionValue} value={optionValue}>
     {optionLabel}
    </option>
   )}
  </select>
 </div>
}

function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <div className="drawer-backdrop"><aside className="drawer crm-modal"><div className="drawer-head"><div><div className="eyebrow">NOVA CRM</div><h2>{title}</h2></div><button className="close" onClick={onClose}><X/></button></div><div className="drawer-body">{children}</div></aside></div>}
function CreateStudent({courses,groups,onClose,onSaved}:{courses:Course[];groups:Group[];onClose:()=>void;onSaved:()=>void}){const [f,setF]=useState<any>({});const [saving,setSaving]=useState(false);async function save(e:any){e.preventDefault();setSaving(true);const r=await fetch("/api/admin/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)});const j=await r.json();setSaving(false);if(!r.ok){alert(j.error||"Xatolik");return}await onSaved()}return <Modal title="Yangi o‘quvchi profili" onClose={onClose}><form onSubmit={save}><FormInput label="Ism va familiya *" value={f.full_name||""} onChange={(v)=>setF({...f,full_name:v})} required/><FormInput label="Email *" type="email" value={f.email||""} onChange={(v)=>setF({...f,email:v})} required/><FormInput label="Vaqtinchalik parol *" type="password" value={f.password||""} onChange={(v)=>setF({...f,password:v})} required placeholder="Kamida 8 belgi"/><FormInput label="Telefon" value={f.phone||""} onChange={(v)=>setF({...f,phone:v})}/><div className="drawer-grid"><FormSelect label="Kurs" value={f.course_id||""} options={courses.map(c=>[c.id,c.name])} onChange={(v)=>setF({...f,course_id:v})}/><FormSelect label="Guruh" value={f.group_id||""} options={groups.map(g=>[g.id,g.name])} onChange={(v)=>setF({...f,group_id:v})}/><FormInput label="Tug‘ilgan sana" type="date" value={f.birth_date||""} onChange={(v)=>setF({...f,birth_date:v})}/><FormInput label="Boshlanish sanasi" type="date" value={f.started_at||""} onChange={(v)=>setF({...f,started_at:v})}/></div><FormInput label="Shahar" value={f.city||""} onChange={(v)=>setF({...f,city:v})}/><FormInput label="Manzil" value={f.address||""} onChange={(v)=>setF({...f,address:v})}/><div className="field"><label>Izoh</label><textarea value={f.notes||""} onChange={e=>setF({...f,notes:e.target.value})}/></div><button className="btn primary btn-lg" style={{width:"100%",marginTop:18}} disabled={saving}>{saving?"Yaratilmoqda...":"Profilni yaratish"}<Check size={16}/></button></form></Modal>}
function StudentDrawer({student,groups,courses,onClose,onSaved}:{student:Student;groups:Group[];courses:Course[];onClose:()=>void;onSaved:()=>void}){
 const [f,setF]=useState(student);
 const [saving,setSaving]=useState(false);
 const [password,setPassword]=useState("");
 const [selectedCourse,setSelectedCourse]=useState("");
 const [selectedGroup,setSelectedGroup]=useState("");
 const [archiving,setArchiving]=useState(false);

 const availableGroups=groups.filter(g=>g.active!==false&&(!selectedCourse||g.course===selectedCourse));

 useEffect(()=>{
  setF(student);
 },[student]);

 useEffect(()=>{
  if(!selectedCourse){
   setSelectedGroup("");
   return;
  }

  if(selectedGroup&&!availableGroups.some(g=>g.id===selectedGroup)){
   setSelectedGroup("");
  }
 },[selectedCourse]);

 async function save(){
  if(!f.full_name.trim()){
   alert("O‘quvchi ismi kerak.");
   return;
  }

  if(password&&password.length<8){
   alert("Yangi parol kamida 8 belgidan iborat bo‘lishi kerak.");
   return;
  }

  setSaving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"student_update",
     id:f.id,
     full_name:f.full_name,
     email:f.email,
     phone:f.phone,
     birth_date:f.birth_date,
     city:f.city,
     address:f.address,
     started_at:f.started_at,
     status:f.status,
     notes:f.notes,
     avatar_url:f.avatar_url,
     password:password||undefined
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Profilni saqlashda xatolik.");
    return;
   }

   if(selectedGroup){
    const groupResponse=await fetch("/api/admin/manage",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({
      action:"student_assign_group",
      student_id:f.id,
      group_id:selectedGroup
     })
    });

    const groupResult=await groupResponse.json();

    if(!groupResponse.ok){
     alert(groupResult.error||"Guruhga biriktirishda xatolik.");
     return;
    }
   }

   setPassword("");
   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setSaving(false);
  }
 }

 async function archiveStudent(){
  if(!confirm("Bu o‘quvchini arxivlashni tasdiqlaysizmi?")){
   return;
  }

  setArchiving(true);

  try{
   const response=await fetch("/api/admin/manage",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     action:"student_archive",
     id:f.id
    })
   });

   const result=await response.json();

   if(!response.ok){
    alert(result.error||"Arxivlashda xatolik.");
    return;
   }

   await onSaved();

  }catch(error:any){
   alert(error?.message||"Server bilan bog‘lanishda xatolik.");
  }finally{
   setArchiving(false);
  }
 }

 return <Modal title={f.full_name} onClose={onClose}>

  <div className="profile-hero">
   <div className="avatar avatar-lg">
    {f.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}
   </div>

   <div>
    <div className="eyebrow">STUDENT PROFILE</div>
    <h3>{f.full_name}</h3>
    <p>{f.role} · {f.status}</p>
   </div>
  </div>

  <div className="crm-panel" style={{marginTop:16}}>
   <div className="eyebrow">PERSONAL INFORMATION</div>
   <h3>Shaxsiy ma’lumotlar</h3>

   <div className="drawer-grid">
    <FormInput
     label="Ism va familiya"
     value={f.full_name}
     onChange={v=>setF({...f,full_name:v})}
     required
    />

    <FormInput
     label="Telefon"
     value={f.phone||""}
     onChange={v=>setF({...f,phone:v})}
    />

    <FormInput
     label="Email"
     value={f.email||""}
     onChange={v=>setF({...f,email:v})}
    />

    <FormInput
     label="Tug‘ilgan sana"
     type="date"
     value={f.birth_date||""}
     onChange={v=>setF({...f,birth_date:v})}
    />

    <FormInput
     label="Shahar"
     value={f.city||""}
     onChange={v=>setF({...f,city:v})}
    />

    <FormSelect
     label="Holat"
     value={f.status||"active"}
     options={[
      ["active","Faol"],
      ["frozen","Muzlatilgan"],
      ["completed","Tugatgan"],
      ["removed","Chiqarilgan"]
     ]}
     onChange={v=>setF({...f,status:v})}
    />
   </div>

   <div className="field" style={{marginTop:14}}>
    <label>Manzil</label>
    <input
     value={f.address||""}
     onChange={e=>setF({...f,address:e.target.value})}
    />
   </div>

   <div className="field" style={{marginTop:14}}>
    <label>Izohlar</label>
    <textarea
     value={f.notes||""}
     onChange={e=>setF({...f,notes:e.target.value})}
    />
   </div>
  </div>

  <div className="crm-panel" style={{marginTop:16}}>
   <div className="eyebrow">ACADEMIC MANAGEMENT</div>
   <h3>Kurs va guruh</h3>

   <div className="drawer-grid">

    <div className="field">
     <label>Kurs</label>

     <select
      value={selectedCourse}
      onChange={e=>{
       setSelectedCourse(e.target.value);
       setSelectedGroup("");
      }}
     >
      <option value="">Kursni tanlang</option>

      {courses
       .filter(c=>c.active!==false)
       .map(c=>
        <option key={c.id} value={c.name}>
         {c.name}
        </option>
       )}
     </select>
    </div>

    <div className="field">
     <label>Guruh</label>

     <select
      value={selectedGroup}
      onChange={e=>setSelectedGroup(e.target.value)}
      disabled={!selectedCourse}
     >
      <option value="">
       {selectedCourse?"Guruhni tanlang":"Avval kursni tanlang"}
      </option>

      {availableGroups.map(g=>
       <option key={g.id} value={g.id}>
        {g.name} — {g.level}
       </option>
      )}
     </select>
    </div>

   </div>

   {selectedGroup&&
    <div className="crm-alert" style={{marginTop:14}}>
     O‘quvchi tanlangan guruhga saqlash vaqtida biriktiriladi.
    </div>
   }
  </div>

  <div className="crm-panel" style={{marginTop:16}}>
   <div className="eyebrow">ACCOUNT ACCESS</div>
   <h3>Login va parol</h3>

   <div className="drawer-grid">

    <div className="field">
     <label>Login / telefon</label>
     <input
      value={f.phone||f.email||""}
      readOnly
     />
    </div>

    <FormInput
     label="Yangi parol"
     type="password"
     value={password}
     onChange={setPassword}
     placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
    />

   </div>

   <p className="muted" style={{marginTop:10}}>
    Parol faqat yangi qiymat kiritilganda o‘zgartiriladi.
   </p>
  </div>

  <div className="profile-tabs">
   <span>Davomat</span>
   <span>To‘lovlar</span>
   <span>Baholar</span>
   <span>Topshiriqlar</span>
   <span>Sertifikat</span>
   <span>Activity</span>
  </div>

  <div className="lead-actions" style={{marginTop:18}}>
   <button
    className="btn primary btn-lg"
    style={{flex:1}}
    onClick={save}
    disabled={saving||archiving}
   >
    {saving?"Saqlanmoqda...":"Barcha o‘zgarishlarni saqlash"}
    <Check size={16}/>
   </button>

   <button
    className="small-action"
    onClick={archiveStudent}
    disabled={saving||archiving}
   >
    <Trash2 size={14}/>
    {archiving?"Arxivlanmoqda...":"Arxivlash"}
   </button>
  </div>

 </Modal>
}
