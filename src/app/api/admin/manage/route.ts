import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const ADMIN_ROLES = ["super_admin", "admin", "manager"];

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

  if (!profile || !ADMIN_ROLES.includes(profile.role)) return null;

  return { user, profile };
}

function serviceClient() {
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
  const admin = await getAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin huquqi talab qilinadi." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const action = body.action;
  const db = serviceClient();

  try {
    // =========================
    // COURSE
    // =========================

    if (action === "course_create") {
      const { name, code, duration_months, price } = body;

      if (!name?.trim()) {
        return NextResponse.json(
          { error: "Kurs nomi kerak." },
          { status: 400 }
        );
      }

      const { data, error } = await db
        .from("courses")
        .insert({
          name: name.trim(),
          code: code?.trim() || null,
          duration_months: Number(duration_months || 0),
          price: Number(price || 0),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    if (action === "course_update") {
      const { id, name, code, duration_months, price, active } = body;

      if (!id || !name?.trim()) {
        return NextResponse.json(
          { error: "Kurs ID va nomi kerak." },
          { status: 400 }
        );
      }

      const { data, error } = await db
        .from("courses")
        .update({
          name: name.trim(),
          code: code?.trim() || null,
          duration_months: Number(duration_months || 0),
          price: Number(price || 0),
          active: active !== false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    if (action === "course_delete") {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Kurs ID kerak." },
          { status: 400 }
        );
      }

      const { error } = await db
        .from("courses")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Kurs deaktivatsiya qilindi.",
      });
    }

    // =========================
    // GROUP
    // =========================

    if (action === "group_create") {
      const { name, course, level, capacity } = body;

      if (!name?.trim()) {
        return NextResponse.json(
          { error: "Guruh nomi kerak." },
          { status: 400 }
        );
      }

      const { data, error } = await db
        .from("groups")
        .insert({
          name: name.trim(),
          course: course || "",
          level: level || "Beginner",
          capacity: Number(capacity || 20),
          active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    if (action === "group_update") {
      const { id, name, course, level, capacity, active } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Guruh ID kerak." },
          { status: 400 }
        );
      }

      const { data, error } = await db
        .from("groups")
        .update({
          name: name?.trim() || "",
          course: course || "",
          level: level || "Beginner",
          capacity: Number(capacity || 20),
          active: active !== false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    if (action === "group_delete") {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Guruh ID kerak." },
          { status: 400 }
        );
      }

      const { error } = await db
        .from("groups")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Guruh deaktivatsiya qilindi.",
      });
    }

    // =========================
    // STUDENT PROFILE
    // =========================

    if (action === "staff_create") {
    const {
      full_name, email, phone, role, status, password,
      city, birth_date, address, started_at, notes, avatar_url
    } = body;

    const allowedStaffRoles = ["mentor", "manager", "admin", "super_admin"];

    if (!full_name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "F.I.Sh., email va parol majburiy." },
        { status: 400 }
      );
    }

    if (!allowedStaffRoles.includes(role)) {
      return NextResponse.json(
        { error: "Noto‘g‘ri xodim roli." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await db.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        phone: phone?.trim() || undefined,
        phone_confirm: phone?.trim() ? true : undefined,
        user_metadata: {
          full_name: full_name.trim(),
          role,
        },
      });

    if (authError || !authData.user) {
      throw authError || new Error("Auth foydalanuvchisini yaratib bo‘lmadi.");
    }

    const staffId = authData.user.id;

    const { error: profileError } = await db.from("profiles").insert({
      id: staffId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      role,
      status: status || "active",
      city: city?.trim() || null,
      birth_date: birth_date || null,
      address: address?.trim() || null,
      started_at: started_at || null,
      notes: notes?.trim() || null,
      avatar_url: avatar_url || null,
      rating_points: 0,
    });

    if (profileError) {
      await db.auth.admin.deleteUser(staffId);
      throw profileError;
    }

    await db.from("crm_activity").insert({
      actor_id: admin.user.id,
      entity_type: "staff",
      entity_id: staffId,
      action: "created",
      description: `${full_name.trim()} xodim sifatida qo‘shildi (${role}).`,
    });

    return NextResponse.json({ success: true, id: staffId });
  }

  if (action === "staff_update") {
    const {
      id, full_name, email, phone, role, status, password,
      city, birth_date, address, started_at, notes, avatar_url
    } = body;

    const allowedStaffRoles = ["mentor", "manager", "admin", "super_admin"];

    if (!id || !full_name?.trim()) {
      return NextResponse.json(
        { error: "Xodim ID va F.I.Sh. kerak." },
        { status: 400 }
      );
    }

    if (!allowedStaffRoles.includes(role)) {
      return NextResponse.json(
        { error: "Noto‘g‘ri xodim roli." },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      full_name: full_name.trim(),
      email: email?.trim().toLowerCase() || null,
      phone: phone?.trim() || null,
      role,
      status: status || "active",
      city: city?.trim() || null,
      birth_date: birth_date || null,
      address: address?.trim() || null,
      started_at: started_at || null,
      notes: notes?.trim() || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await db
      .from("profiles")
      .update(updateData)
      .eq("id", id);

    if (profileError) throw profileError;

    const authUpdate: Record<string, any> = {
      user_metadata: {
        full_name: full_name.trim(),
        role,
      },
    };

    if (email?.trim()) {
      authUpdate.email = email.trim().toLowerCase();
    }

    if (phone?.trim()) {
      authUpdate.phone = phone.trim();
      authUpdate.phone_confirm = true;
    } else {
      authUpdate.phone = null;
    }

    if (password) {
      authUpdate.password = password;
    }

    const { error: authError } =
      await db.auth.admin.updateUserById(id, authUpdate);

    if (authError) throw authError;

    await db.from("crm_activity").insert({
      actor_id: admin.user.id,
      entity_type: "staff",
      entity_id: id,
      action: "updated",
      description: `${full_name.trim()} xodim profili yangilandi.`,
    });

    return NextResponse.json({ success: true });
  }

  if (action === "staff_status") {
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Xodim ID va holat kerak." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("profiles")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("role", ["mentor", "manager", "admin", "super_admin"]);

    if (error) throw error;

    await db.from("crm_activity").insert({
      actor_id: admin.user.id,
      entity_type: "staff",
      entity_id: id,
      action: "status_changed",
      description: `Xodim holati ${status} ga o‘zgartirildi.`,
    });

    return NextResponse.json({ success: true });
  }

  if (action === "staff_archive") {
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Xodim ID kerak." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("profiles")
      .update({
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("role", ["mentor", "manager", "admin", "super_admin"]);

    if (error) throw error;

    await db.from("crm_activity").insert({
      actor_id: admin.user.id,
      entity_type: "staff",
      entity_id: id,
      action: "archived",
      description: "Xodim profili arxivlandi.",
    });

    return NextResponse.json({ success: true });
  }

  if (action === "student_update") {
      const {
        id,
        full_name,
        email,
        phone,
        birth_date,
        city,
        address,
        started_at,
        status,
        notes,
        avatar_url,
        password,
        login_username,
        crm_login_enabled,
        hub_login_enabled,
      } = body;

      if (!id || !full_name?.trim()) {
        return NextResponse.json(
          { error: "O‘quvchi ID va ism kerak." },
          { status: 400 }
        );
      }

      const normalizedUsername = login_username?.trim()
        ? login_username.trim().toLowerCase().replace(/\s+/g, "")
        : null;

      if (normalizedUsername && !/^[a-z0-9._-]{3,32}$/.test(normalizedUsername)) {
        return NextResponse.json(
          { error: "Username 3–32 belgidan iborat bo‘lishi va faqat a-z, 0-9, nuqta, _ yoki - ishlatishi kerak." },
          { status: 400 }
        );
      }

      if (normalizedUsername) {
        const { data: existingUsername, error: usernameError } = await db
          .from("profiles")
          .select("id")
          .ilike("login_username", normalizedUsername)
          .neq("id", id)
          .maybeSingle();

        if (usernameError) throw usernameError;

        if (existingUsername) {
          return NextResponse.json(
            { error: `Bu username allaqachon ishlatilgan: ${normalizedUsername}` },
            { status: 409 }
          );
        }
      }

      const updateData: Record<string, any> = {
        full_name: full_name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        login_username: normalizedUsername,
        crm_login_enabled: crm_login_enabled !== false,
        hub_login_enabled: hub_login_enabled !== false,
        birth_date: birth_date || null,
        city: city?.trim() || null,
        address: address?.trim() || null,
        started_at: started_at || null,
        status: status || "active",
        notes: notes?.trim() || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await db
        .from("profiles")
        .update(updateData)
        .eq("id", id);

      if (profileError) throw profileError;

      const { error: hubSettingsError } = await db
        .from("student_hub_settings")
        .upsert(
          {
            student_id: id,
            hub_enabled: hub_login_enabled !== false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        );

      if (hubSettingsError) throw hubSettingsError;

      const authUpdate: Record<string, any> = {};

      if (email?.trim()) {
        authUpdate.email = email.trim().toLowerCase();
      }

      if (phone?.trim()) {
        authUpdate.phone = phone.trim();
        authUpdate.phone_confirm = true;
      }

      authUpdate.user_metadata = {
        full_name: full_name.trim(),
        role: "student",
        login_username: normalizedUsername,
      };

      if (password) {
        if (password.length < 8) {
          return NextResponse.json(
            { error: "Parol kamida 8 belgidan iborat bo‘lishi kerak." },
            { status: 400 }
          );
        }

        authUpdate.password = password;
      }

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await db.auth.admin.updateUserById(
          id,
          authUpdate
        );

        if (authError) throw authError;
      }

      await db.from("crm_activity").insert({
        actor_id: admin.user.id,
        entity_type: "student",
        entity_id: id,
        action: "updated",
        description: `${full_name.trim()} o‘quvchi profili admin tomonidan yangilandi.`,
      });

      return NextResponse.json({ success: true });
    }

    // =========================
    // STUDENT STATUS
    // =========================

    if (action === "student_hub_permissions") {
      const {
        student_id,
        hub_enabled,
        dashboard_enabled,
        attendance_enabled,
        payments_enabled,
        grades_enabled,
        tasks_enabled,
        certificates_enabled,
        schedule_enabled,
        activity_enabled,
      } = body;

      if (!student_id) {
        return NextResponse.json(
          { error: "student_id kerak." },
          { status: 400 }
        );
      }

      const { data: student, error: studentError } = await db
        .from("profiles")
        .select("id,role")
        .eq("id", student_id)
        .eq("role", "student")
        .maybeSingle();

      if (studentError) {
        return NextResponse.json(
          { error: studentError.message },
          { status: 500 }
        );
      }

      if (!student) {
        return NextResponse.json(
          { error: "O‘quvchi topilmadi." },
          { status: 404 }
        );
      }

      const { data, error } = await db
        .from("student_hub_settings")
        .upsert(
          {
            student_id,
            hub_enabled: hub_enabled !== false,
            dashboard_enabled: dashboard_enabled !== false,
            attendance_enabled: attendance_enabled !== false,
            payments_enabled: payments_enabled !== false,
            grades_enabled: grades_enabled !== false,
            tasks_enabled: tasks_enabled !== false,
            certificates_enabled: certificates_enabled !== false,
            schedule_enabled: schedule_enabled !== false,
            activity_enabled: activity_enabled !== false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id" }
        )
        .select()
        .single();

      if (error) {
        console.error("student_hub_permissions:", error);

        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      try {
        await db.from("crm_activity").insert({
          actor_id: admin.profile.id,
          entity_type: "student",
          entity_id: student_id,
          action: "hub_permissions_updated",
          description: "Student HUB ruxsatlari yangilandi.",
          metadata: {
            hub_enabled: hub_enabled !== false,
            dashboard_enabled: dashboard_enabled !== false,
            attendance_enabled: attendance_enabled !== false,
            payments_enabled: payments_enabled !== false,
            grades_enabled: grades_enabled !== false,
            tasks_enabled: tasks_enabled !== false,
            certificates_enabled: certificates_enabled !== false,
            schedule_enabled: schedule_enabled !== false,
            activity_enabled: activity_enabled !== false,
          },
        });
      } catch (activityError) {
        console.warn("crm_activity:", activityError);
      }

      return NextResponse.json({
        success: true,
        settings: data,
      });
    }

    if (action === "student_assign_group") {
      const { student_id, group_id } = body;

      if (!student_id || !group_id) {
        return NextResponse.json(
          { error: "O‘quvchi ID va guruh ID kerak." },
          { status: 400 }
        );
      }

      const { data: group, error: groupError } = await db
        .from("groups")
        .select("id,name,course")
        .eq("id", group_id)
        .single();

      if (groupError || !group) {
        return NextResponse.json(
          { error: "Tanlangan guruh topilmadi." },
          { status: 404 }
        );
      }

      const { data: course, error: courseError } = await db
        .from("courses")
        .select("id,name")
        .eq("name", group.course)
        .maybeSingle();

      if (courseError) throw courseError;

      const { data: existing, error: existingError } = await db
        .from("enrollments")
        .select("id")
        .eq("student_id", student_id)
        .eq("status", "active");

      if (existingError) throw existingError;

      if (existing?.length) {
        const { error } = await db
          .from("enrollments")
          .update({
            group_id,
            course_id: course?.id || null,
            status: "active",
          })
          .eq("id", existing[0].id);

        if (error) throw error;
      } else {
        const { error } = await db
          .from("enrollments")
          .insert({
            student_id,
            group_id,
            course_id: course?.id || null,
            status: "active",
          });

        if (error) throw error;
      }

      await db.from("crm_activity").insert({
        actor_id: admin.user.id,
        entity_type: "student",
        entity_id: student_id,
        action: "group_assigned",
        description: `O‘quvchi ${group.name} guruhiga biriktirildi.`,
      });

      return NextResponse.json({
        success: true,
        group: group.name,
      });
    }

    if (action === "student_status") {
      const { id, status } = body;

      if (!id || !status) {
        return NextResponse.json(
          { error: "O‘quvchi ID va status kerak." },
          { status: 400 }
        );
      }

      const { error } = await db
        .from("profiles")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    // =========================
    // STUDENT DELETE / ARCHIVE
    // =========================

    if (action === "student_archive") {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { error: "O‘quvchi ID kerak." },
          { status: 400 }
        );
      }

      const { error } = await db
        .from("profiles")
        .update({
          status: "removed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      await db.from("crm_activity").insert({
        actor_id: admin.user.id,
        entity_type: "student",
        entity_id: id,
        action: "archived",
        description: "O‘quvchi profili arxivlandi.",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: `Noma'lum action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("ADMIN MANAGE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Admin operatsiyasini bajarishda xatolik yuz berdi.",
      },
      { status: 500 }
    );
  }
}
