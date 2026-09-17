import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,role").eq("id", user.id).single();
  if (!profile || !["super_admin","admin","manager"].includes(profile.role)) return null;
  return user;
}

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Admin huquqi talab qilinadi." }, { status: 403 });
  const body = await req.json();
  const { full_name, email, password, phone, birth_date, city, address, course_id, group_id, started_at, notes, avatar_url } = body;
  if (!full_name?.trim() || !email?.trim() || !password || password.length < 8) {
    return NextResponse.json({ error: "Ism, email va kamida 8 belgili parol kerak." }, { status: 400 });
  }
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: created, error: authError } = await adminClient.auth.admin.createUser({
    email: email.trim().toLowerCase(), password, email_confirm: true,
    user_metadata: { full_name: full_name.trim() }
  });
  if (authError || !created.user) return NextResponse.json({ error: authError?.message || "Auth user yaratilmadi." }, { status: 400 });

  const studentId = created.user.id;
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: studentId, full_name: full_name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null,
    birth_date: birth_date || null, city: city?.trim() || null, address: address?.trim() || null,
    started_at: started_at || new Date().toISOString().slice(0,10), notes: notes?.trim() || null,
    avatar_url: avatar_url || null, role: "student", status: "active", updated_at: new Date().toISOString()
  });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(studentId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  if (group_id) {
    const { error } = await adminClient.from("enrollments").upsert({ student_id: studentId, group_id, course_id: course_id || null, active: true, status: "active" }, { onConflict: "student_id,group_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await adminClient.from("crm_activity").insert({ actor_id: admin.id, entity_type: "student", entity_id: studentId, action: "created", description: `${full_name.trim()} o‘quvchi sifatida yaratildi.` });
  return NextResponse.json({ id: studentId });
}
