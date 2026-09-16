"use client";

import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function redirectByRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      router.replace("/admin");
    } else if (profile?.role === "student") {
      router.replace("/dashboard");
    } else {
      await supabase.auth.signOut();
      setError("Bu hisob NOVA ACADEMY tizimiga biriktirilmagan.");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirectByRole();
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email yoki parol noto‘g‘ri, yoki hisob faol emas.");
      setLoading(false);
      return;
    }

    await redirectByRole();
    setLoading(false);
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
              <Sparkles size={14} /> NOVA PLATFORM
            </div>

            <h1>
              Bilimingizni boshqaring.{" "}
              <span className="accent">Natijangizni ko‘ring.</span>
            </h1>

            <p className="muted">
              Faqatgina NOVA ACADEMY o‘quvchilari va administratorlari tizimga
              kira oladi. Shaxsiy profilingiz, baholaringiz, davomat va guruh
              reytingingiz shu yerda saqlanadi.
            </p>

            <div className="auth-points">
              <span>
                <ShieldCheck size={17} /> Shaxsiy dashboard
              </span>
              <span>
                <ShieldCheck size={17} /> Guruh bo‘yicha reyting
              </span>
              <span>
                <ShieldCheck size={17} /> Ball va baholar tarixi
              </span>
            </div>
          </section>

          <form className="auth-card" onSubmit={submit}>
            <div className="auth-card-icon">
              <LockKeyhole />
            </div>

            <div className="eyebrow">NOVA ACADEMY · SECURE ACCESS</div>

            <h2>Tizimga kirish</h2>

            <p className="login-notice">
              <ShieldCheck size={15} /> Faqatgina{" "}
              <strong>NOVA ACADEMY</strong> o‘quvchilari va administratorlari
              tizimga kira oladi.
            </p>

            <div className="field">
              <label>Email</label>

              <div className="input-icon">
                <Mail size={16} />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
              {loading ? "Tekshirilmoqda..." : "LOGIN"}
              <ArrowRight size={17} />
            </button>

            <p className="login-footnote">
              Hisob yaratish faqat NOVA ACADEMY administratsiyasi orqali
              amalga oshiriladi.
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
