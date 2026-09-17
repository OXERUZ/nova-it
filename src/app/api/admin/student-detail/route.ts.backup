import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

const ADMIN_ROLES = ["super_admin", "admin", "manager"];

function adminDb() {
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

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) return null;

  return profile;
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Ruxsat berilmagan." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const studentId = url.searchParams.get("student_id");

    if (!studentId) {
      return NextResponse.json(
        { error: "student_id kerak." },
        { status: 400 }
      );
    }

    const db = adminDb();

    const [
      profileResult,
      settingsResult,
      enrollmentsResult,
      attendanceResult,
      paymentsResult,
      gradesResult,
      tasksResult,
      certificatesResult,
      activityResult,
    ] = await Promise.all([
      db
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          role,
          status,
          city,
          birth_date,
          address,
          started_at,
          notes,
          avatar_url,
          login_username,
          crm_login_enabled,
          hub_login_enabled,
          rating_points
        `)
        .eq("id", studentId)
        .eq("role", "student")
        .maybeSingle(),

      db
        .from("student_hub_settings")
        .select(`
          student_id,
          hub_enabled,
          dashboard_enabled,
          attendance_enabled,
          payments_enabled,
          grades_enabled,
          tasks_enabled,
          certificates_enabled,
          schedule_enabled,
          activity_enabled
        `)
        .eq("student_id", studentId)
        .maybeSingle(),

      db
        .from("enrollments")
        .select(`
          id,
          student_id,
          group_id,
          course_id,
          active,
          status,
          joined_at,
          end_date,
          groups(id,name,course,level,capacity,active),
          courses(id,name,code,price,active)
        `)
        .eq("student_id", studentId)
        .order("joined_at", { ascending: false }),

      db
        .from("attendance")
        .select(`
          id,
          student_id,
          group_id,
          attendance_date,
          status,
          note,
          created_by
        `)
        .eq("student_id", studentId)
        .order("attendance_date", { ascending: false })
        .limit(100),

      db
        .from("payments")
        .select(`
          id,
          student_id,
          course_id,
          amount,
          payment_date,
          method,
          status,
          receipt_no,
          note,
          created_by
        `)
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false })
        .limit(100),

      db
        .from("grades")
        .select(`
          id,
          student_id,
          subject,
          assessment,
          score,
          created_at
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(100),

      db
        .from("student_tasks")
        .select(`
          id,
          student_id,
          title,
          subject,
          description,
          due_at,
          due_date,
          status,
          priority,
          score,
          mentor_note,
          created_by,
          assigned_by,
          completed_at,
          created_at,
          updated_at
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(100),

      db
        .from("student_certificates")
        .select(`
          id,
          student_id,
          title,
          course_name,
          certificate_no,
          issued_at,
          file_url,
          status,
          created_by,
          created_at
        `)
        .eq("student_id", studentId)
        .order("issued_at", { ascending: false }),

      db
        .from("crm_activity")
        .select(`
          id,
          actor_id,
          entity_type,
          entity_id,
          action,
          description,
          metadata,
          created_at
        `)
        .eq("entity_id", studentId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const firstError = [
      profileResult,
      settingsResult,
      enrollmentsResult,
      attendanceResult,
      paymentsResult,
      gradesResult,
      tasksResult,
      certificatesResult,
      activityResult,
    ].find((result) => result.error);

    if (firstError?.error) {
      console.error("student-detail GET:", firstError.error);

      return NextResponse.json(
        { error: firstError.error.message },
        { status: 500 }
      );
    }

    if (!profileResult.data) {
      return NextResponse.json(
        { error: "Student topilmadi." },
        { status: 404 }
      );
    }

    const attendance = attendanceResult.data || [];
    const payments = paymentsResult.data || [];
    const grades = gradesResult.data || [];
    const tasks = tasksResult.data || [];

    const paid = payments
      .filter((item: any) => item.status === "paid")
      .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

    const coursePrice = (enrollmentsResult.data || []).reduce(
      (sum: number, enrollment: any) =>
        sum + Number(enrollment.courses?.price || 0),
      0
    );

    const present = attendance.filter(
      (item: any) => item.status === "present"
    ).length;

    const attendancePercent = attendance.length
      ? Math.round((present / attendance.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      profile: profileResult.data,
      settings: settingsResult.data || {
        student_id: studentId,
        hub_enabled: false,
        dashboard_enabled: false,
        attendance_enabled: false,
        payments_enabled: false,
        grades_enabled: false,
        tasks_enabled: false,
        certificates_enabled: false,
        schedule_enabled: false,
        activity_enabled: false,
      },
      enrollments: enrollmentsResult.data || [],
      attendance,
      payments,
      grades,
      tasks,
      certificates: certificatesResult.data || [],
      activity: activityResult.data || [],
      summary: {
        course_price: coursePrice,
        paid,
        balance: Math.max(coursePrice - paid, 0),
        attendance_percent: attendancePercent,
        grades_count: grades.length,
        tasks_count: tasks.length,
        completed_tasks: tasks.filter(
          (item: any) => item.status === "completed"
        ).length,
      },
    });
  } catch (error: any) {
    console.error("student-detail GET:", error);

    return NextResponse.json(
      { error: error?.message || "Server xatosi." },
      { status: 500 }
    );
  }
}
