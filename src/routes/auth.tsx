import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/yonetim", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
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
        toast.success("Kayıt oluşturuldu. E-postanızı onayladıktan sonra giriş yapabilirsiniz.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/yonetim", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
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
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "İşleniyor…" : mode === "signin" ? "Giriş yap" : "Kayıt ol"}
            </Button>
          </form>

          <Button variant="outline" className="w-full" onClick={google}>
            Google ile devam et
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
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
