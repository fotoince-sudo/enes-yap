import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Personel Girişi — Enes Yapı Yönetim Paneli" },
      {
        name: "description",
        content: "Enes Yapı yönetim paneline giriş yapın; tadilat talepleri, keşifler, teklifler ve projeleri yönetin.",
      },
      { property: "og:title", content: "Personel Girişi — Enes Yapı" },
      { property: "og:description", content: "Enes Yapı yönetim paneli girişi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Geçerli bir e-posta yazın." }).max(255),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalı." }).max(72),
  fullName: z.string().trim().max(100).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("kayit") === "1") setMode("signup");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/yonetim", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setErrorText(null);

    if (mode === "forgot") {
      const mail = z.string().trim().email().safeParse(email);
      if (!mail.success) {
        setErrorText("Geçerli bir e-posta yazın.");
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(mail.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice(
          `${mail.data} adresine şifre sıfırlama bağlantısı gönderildi. E-postadaki bağlantıya tıklayıp yeni şifrenizi belirleyin.`,
        );
        toast.success("Şifre sıfırlama e-postası gönderildi.");
      } catch (err) {
        const raw = err instanceof Error ? err.message : "";
        const msg = /after \d+ seconds/i.test(raw)
          ? "Çok sık denediniz. Lütfen bir dakika bekleyip tekrar deneyin."
          : raw || "Bir hata oluştu.";
        setErrorText(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      setErrorText(parsed.error.issues[0]!.message);
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/yonetim`,
            data: { full_name: parsed.data.fullName || null },
          },
        });
        if (error) throw error;
        setNotice(
          `Kaydınız oluşturuldu. ${parsed.data.email} adresine bir onay e-postası gönderildi. Bağlantıya tıkladıktan sonra bu sayfadan giriş yapabilirsiniz.`,
        );
        toast.success("Kayıt oluşturuldu. E-postanızı onaylayın.");
        setMode("signin");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/yonetim", replace: true });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      let msg = raw || "Bir hata oluştu.";
      if (/already registered|already been registered/i.test(raw)) {
        msg = "Bu e-posta ile zaten bir kayıt var. Giriş yapmayı deneyin veya e-posta onayınızı tamamlayın.";
      } else if (/Invalid login credentials/i.test(raw)) {
        msg = "E-posta veya şifre hatalı. Kayıt olduysanız e-posta onayını tamamladığınızdan emin olun.";
      } else if (/Email not confirmed/i.test(raw)) {
        msg = "E-posta adresiniz henüz onaylanmadı. Gelen kutunuzdaki onay bağlantısına tıklayın.";
      } else if (/weak and easy to guess/i.test(raw)) {
        msg = "Bu şifre çok zayıf ve daha önce sızmış şifreler arasında. Lütfen daha güçlü bir şifre seçin.";
      } else if (/after \d+ seconds/i.test(raw)) {
        msg = "Çok sık denediniz. Lütfen bir dakika bekleyip tekrar deneyin.";
      }
      setErrorText(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google ile giriş yapılamadı.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/yonetim", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enes Yapı — Personel Girişi</CardTitle>
          <CardDescription>
            Yönetim paneline erişim için giriş yapın. Panel yetkisi yöneticiniz tarafından tanımlanır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice ? (
            <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
              {notice}
            </div>
          ) : null}
          {errorText ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {errorText}
            </div>
          ) : null}
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" ? (
              <div>
                <Label htmlFor="fullName">Ad soyad</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" ? (
              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "İşleniyor…"
                : mode === "signin"
                  ? "Giriş yap"
                  : mode === "signup"
                    ? "Kayıt ol"
                    : "Sıfırlama bağlantısı gönder"}
            </Button>
          </form>

          {mode === "signin" ? (
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline"
              onClick={() => {
                setMode("forgot");
                setNotice(null);
                setErrorText(null);
              }}
            >
              Şifremi unuttum
            </button>
          ) : null}

          {mode !== "forgot" ? (
            <Button variant="outline" className="w-full" onClick={google}>
              Google ile devam et
            </Button>
          ) : null}

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setNotice(null);
              setErrorText(null);
            }}
          >
            {mode === "signin" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
          </button>

          <div className="text-center text-sm">
            <Link to="/" className="text-muted-foreground underline">
              Siteye dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
