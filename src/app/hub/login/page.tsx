"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function HubLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !active) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,hub_login_enabled,status")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profile?.role === "student" &&
        profile.status === "active" &&
        profile.hub_login_enabled !== false
      ) {
        router.replace("/academy-hub");
      }
    })();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const normalizedUsername = username
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    try {
      const resolver = await fetch("/api/hub/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: normalizedUsername,
        }),
      });

      const result = await resolver.json();

      if (!resolver.ok) {
        setError(result.error || "Login amalga oshmadi.");
        return;
      }

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: result.email,
          password,
        });

      if (authError) {
        setError("Username yoki parol noto‘g‘ri.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sessiya yaratilmadi.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,hub_login_enabled,status")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profile?.role !== "student" ||
        profile.status !== "active" ||
        profile.hub_login_enabled === false
      ) {
        await supabase.auth.signOut();
        setError("NOVA HUB uchun kirish huquqi mavjud emas.");
        return;
      }

      router.replace("/academy-hub");
    } catch {
      setError("Server bilan bog‘lanishda xatolik.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />

      <div className="auth-shell">
        <a href="/" className="logo auth-logo">
          NOVA <span>ACADEMY</span>
        </a>

        <div className="auth-grid">
          <section className="auth-intro">
            <div className="eyebrow">
              <Sparkles size={14} /> NOVA HUB
            </div>

            <h1>
              Your learning.
              <span className="accent"> Your command center.</span>
            </h1>

            <p className="muted">
              NOVA HUB — NOVA ACADEMY o‘quvchilari uchun shaxsiy
              learning environment.
            </p>

            <div className="auth-points">
              <span>
                <ShieldCheck size={17} /> Shaxsiy Student Hub
              </span>
              <span>
                <ShieldCheck size={17} /> Kurs va progress
              </span>
              <span>
                <ShieldCheck size={17} /> Davomat, baholar va topshiriqlar
              </span>
            </div>
          </section>

          <form className="auth-card" onSubmit={submit}>
            <div className="auth-card-icon">
              <LockKeyhole />
            </div>

            <div className="eyebrow">
              NOVA HUB · STUDENT ACCESS
            </div>

            <h2>HUB'ga kirish</h2>

            <p className="login-notice">
              <ShieldCheck size={15} /> Faqat NOVA ACADEMY o‘quvchilari
              uchun.
            </p>

            <div className="field">
              <label>NOVA Username</label>

              <div className="input-icon">
                <UserRound size={16} />

                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "")
                    )
                  }
                  placeholder="username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Parol</label>

              <div className="input-icon">
                <LockKeyhole size={16} />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn primary btn-lg"
              style={{ width: "100%", marginTop: 18 }}
              disabled={loading}
            >
              {loading ? "Tekshirilmoqda..." : "NOVA HUB'GA KIRISH"}
              <ArrowRight size={17} />
            </button>

            <p className="login-footnote">
              Username va parol NOVA ACADEMY administratsiyasi
              tomonidan beriladi.
            </p>

            <a className="back-link" href="/">
              ← Bosh sahifaga qaytish
            </a>
          </form>
        </div>
      </div>
    </main>
  );
}
