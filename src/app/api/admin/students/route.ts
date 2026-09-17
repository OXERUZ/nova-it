import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function getAdminUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "manager"].includes(profile.role)) {
    return null;
  }

  return user;
}

export async function POST(req: Request) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin huquqi talab qilinadi." },
      { status: 403 }
    );
  }

  const body = await req.json();

  const {
    full_name,
    email,
    password,
    phone,
    login_username,
    hub_login_enabled = true,
    crm_login_enabled = true,
    birth_date,
    city,
    address,
    course_id,
    group_id,
    started_at,
    notes,
    avatar_url,
  } = body;

  if (!full_name?.trim()) {
    return NextResponse.json(
      { error: "O‘quvchi F.I.Sh. kerak." },
      { status: 400 }
    );
  }

  if (!email?.trim()) {
    return NextResponse.json(
      { error: "Email kerak." },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." },
      { status: 400 }
    );
  }

  if (!login_username?.trim()) {
    return NextResponse.json(
      { error: "NOVA login username kerak." },
      { status: 400 }
    );
  }

  const username = login_username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username 3–32 belgidan iborat bo‘lishi va faqat a-z, 0-9, nuqta, _ yoki - ishlatishi kerak.",
      },
      { status: 400 }
    );
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // =========================================================
  // USERNAME UNIQUENESS
  // =========================================================

  const { data: existingUsername, error: usernameCheckError } =
    await adminClient
      .from("profiles")
      .select("id,full_name")
      .ilike("login_username", username)
      .maybeSingle();

  if (usernameCheckError) {
    return NextResponse.json(
      { error: usernameCheckError.message },
      { status: 400 }
    );
  }

  if (existingUsername) {
    return NextResponse.json(
      {
        error: `Bu username allaqachon ishlatilgan: ${username}`,
      },
      { status: 409 }
    );
  }

  // =========================================================
  // CREATE SUPABASE AUTH USER
  // =========================================================

  const normalizedEmail = email.trim().toLowerCase();

  const {
    data: created,
    error: authError,
  } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,

    ...(phone?.trim()
      ? {
          phone: phone.trim(),
          phone_confirm: true,
        }
      : {}),

    user_metadata: {
      full_name: full_name.trim(),
      role: "student",
      login_username: username,
    },
  });

  if (authError || !created.user) {
    return NextResponse.json(
      {
        error:
          authError?.message ||
          "Supabase Auth user yaratilmadi.",
      },
      { status: 400 }
    );
  }

  const studentId = created.user.id;

  // =========================================================
  // CREATE PROFILE
  // =========================================================

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: studentId,

      full_name: full_name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,

      login_username: username,

      crm_login_enabled: Boolean(crm_login_enabled),
      hub_login_enabled: Boolean(hub_login_enabled),

      birth_date: birth_date || null,
      city: city?.trim() || null,
      address: address?.trim() || null,

      started_at:
        started_at ||
        new Date().toISOString().slice(0, 10),

      notes: notes?.trim() || null,
      avatar_url: avatar_url || null,

      role: "student",
      status: "active",

      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(studentId);

    return NextResponse.json(
      { error: profileError.message },
      { status: 400 }
    );
  }

  // =========================================================
  // NOVA HUB SETTINGS
  // =========================================================

  const { error: hubSettingsError } = await adminClient
    .from("student_hub_settings")
    .upsert(
      {
        student_id: studentId,

        hub_enabled: Boolean(hub_login_enabled),
        dashboard_enabled: true,
        attendance_enabled: true,
        payments_enabled: true,
        grades_enabled: true,
        tasks_enabled: true,
        certificates_enabled: true,
        schedule_enabled: true,
        activity_enabled: true,

        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id",
      }
    );

  if (hubSettingsError) {
    // Roll back the complete student account if HUB setup fails.
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", studentId);

    await adminClient.auth.admin.deleteUser(studentId);

    return NextResponse.json(
      { error: hubSettingsError.message },
      { status: 400 }
    );
  }

  // =========================================================
  // GROUP ENROLLMENT
  // =========================================================

  if (group_id) {
    const { error } = await adminClient
      .from("enrollments")
      .upsert(
        {
          student_id: studentId,
          group_id,
          course_id: course_id || null,
          active: true,
          status: "active",
        },
        {
          onConflict: "student_id,group_id",
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
  }

  // =========================================================
  // CRM ACTIVITY
  // =========================================================

  await adminClient.from("crm_activity").insert({
    actor_id: admin.id,
    entity_type: "student",
    entity_id: studentId,
    action: "created",
    description:
      `${full_name.trim()} o‘quvchi sifatida yaratildi. ` +
      `NOVA username: ${username}`,
    metadata: {
      login_username: username,
      hub_login_enabled: Boolean(hub_login_enabled),
      crm_login_enabled: Boolean(crm_login_enabled),
    },
  });

  return NextResponse.json({
    success: true,
    id: studentId,
    login_username: username,
    hub_login_enabled: Boolean(hub_login_enabled),
  });
}
