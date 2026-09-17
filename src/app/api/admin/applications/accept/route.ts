import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("998") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("8") && digits.length === 9) {
    return `+998${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `+998${digits}`;
  }

  return value.startsWith("+") ? value : `+${digits}`;
}

async function getAdmin() {
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
  const admin = await getAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin huquqi talab qilinadi." },
      { status: 403 }
    );
  }

  const body = await req.json();

  const {
    application_id,
    group_id,
    password,
    started_at,
    payment_amount,
    payment_date,
    payment_status,
    payment_method,
    payment_note,
  } = body;

  if (!application_id || !group_id || !password) {
    return NextResponse.json(
      { error: "Ariza, guruh va parol majburiy." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." },
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

  const { data: application, error: applicationError } =
    await adminClient
      .from("applications")
      .select("*")
      .eq("id", application_id)
      .single();

  if (applicationError || !application) {
    return NextResponse.json(
      { error: applicationError?.message || "Ariza topilmadi." },
      { status: 404 }
    );
  }

  const phone = normalizePhone(application.phone);

  const { data: group, error: groupError } = await adminClient
    .from("groups")
    .select("id,name,course,level")
    .eq("id", group_id)
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { error: groupError?.message || "Guruh topilmadi." },
      { status: 400 }
    );
  }

  // Kursni guruhdagi course nomi orqali topamiz.
  const { data: course } = await adminClient
    .from("courses")
    .select("id,name,price")
    .eq("name", group.course)
    .maybeSingle();

  // Bir xil telefon bilan oldindan student yaratilganini tekshiramiz.
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  let studentId = existingProfile?.id || null;

  // Agar hali Auth account bo‘lmasa, yaratamiz.
  if (!studentId) {
    const { data: created, error: authError } =
      await adminClient.auth.admin.createUser({
        phone,
        password,
        phone_confirm: true,
        user_metadata: {
          full_name: application.full_name,
        },
      });

    if (authError || !created.user) {
      return NextResponse.json(
        { error: authError?.message || "O‘quvchi login hisobi yaratilmadi." },
        { status: 400 }
      );
    }

    studentId = created.user.id;
  } else {
    // Mavjud Auth account uchun yangi parolni o‘rnatamiz.
    const { error: updateAuthError } =
      await adminClient.auth.admin.updateUserById(studentId, {
        password,
        phone,
        phone_confirm: true,
      });

    if (updateAuthError) {
      return NextResponse.json(
        { error: updateAuthError.message },
        { status: 400 }
      );
    }
  }

  // Profile yaratish / yangilash.
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: studentId,
        full_name: application.full_name,
        phone,
        email: application.email || null,
        role: "student",
        status: "active",
        started_at:
          started_at || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 400 }
    );
  }

  // Guruhga biriktirish.
  const { error: enrollmentError } = await adminClient
    .from("enrollments")
    .upsert(
      {
        student_id: studentId,
        group_id,
        course_id: course?.id || null,
        active: true,
        status: "active",
        joined_at: started_at
          ? new Date(`${started_at}T00:00:00`).toISOString()
          : new Date().toISOString(),
      },
      { onConflict: "student_id,group_id" }
    );

  if (enrollmentError) {
    return NextResponse.json(
      { error: enrollmentError.message },
      { status: 400 }
    );
  }

  // To‘lov kiritilgan bo‘lsa, payment yozamiz.
  const amount = Number(payment_amount || 0);

  if (amount > 0) {
    const { error: paymentError } = await adminClient
      .from("payments")
      .insert({
        student_id: studentId,
        course_id: course?.id || null,
        amount,
        payment_date:
          payment_date || new Date().toISOString().slice(0, 10),
        method: payment_method || "cash",
        status: payment_status || "paid",
        note: payment_note || null,
        created_by: admin.id,
      });

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 400 }
      );
    }
  }

  // Arizani qabul qilingan holatga o'tkazamiz.
  const { error: applicationUpdateError } = await adminClient
    .from("applications")
    .update({
      status: "accepted",
      admin_note:
        `O‘quvchi qabul qilindi. Guruh: ${group.name}. Login: ${phone}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application_id);

  if (applicationUpdateError) {
    return NextResponse.json(
      { error: applicationUpdateError.message },
      { status: 400 }
    );
  }

  // Audit.
  await adminClient.from("crm_activity").insert({
    actor_id: admin.id,
    entity_type: "student",
    entity_id: studentId,
    action: "accepted",
    description:
      `${application.full_name} o‘quvchi sifatida qabul qilindi va ${group.name} guruhiga biriktirildi.`,
    metadata: {
      application_id,
      group_id,
      group_name: group.name,
      phone,
      payment_amount: amount,
    },
  });

  return NextResponse.json({
    success: true,
    student_id: studentId,
    login: phone,
    group: group.name,
  });
}
