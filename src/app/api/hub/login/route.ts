import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const username = String(body?.username || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return NextResponse.json(
        { error: "NOVA Username noto‘g‘ri." },
        { status: 400 }
      );
    }

    const db = adminClient();

    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select(
        "id,email,phone,role,status,login_username,hub_login_enabled"
      )
      .ilike("login_username", username)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Hisobni tekshirishda xatolik." },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== "student") {
      return NextResponse.json(
        { error: "Username yoki parol noto‘g‘ri." },
        { status: 401 }
      );
    }

    if (profile.status !== "active") {
      return NextResponse.json(
        { error: "Bu o‘quvchi hisobi faol emas." },
        { status: 403 }
      );
    }

    if (profile.hub_login_enabled === false) {
      return NextResponse.json(
        { error: "NOVA HUB uchun kirish huquqi o‘chirilgan." },
        { status: 403 }
      );
    }

    const { data: hubSettings } = await db
      .from("student_hub_settings")
      .select("hub_enabled")
      .eq("student_id", profile.id)
      .maybeSingle();

    if (hubSettings?.hub_enabled === false) {
      return NextResponse.json(
        { error: "NOVA HUB hisobingiz uchun o‘chirilgan." },
        { status: 403 }
      );
    }

    const loginEmail = profile.email?.trim();

    if (!loginEmail) {
      return NextResponse.json(
        {
          error:
            "Bu o‘quvchi hisobida login email mavjud emas. Administrator profilni tekshirishi kerak.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      email: loginEmail,
    });
  } catch {
    return NextResponse.json(
      { error: "Server xatosi." },
      { status: 500 }
    );
  }
}
