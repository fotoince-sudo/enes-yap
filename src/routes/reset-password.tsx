import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Yeni Şifre Belirle — Enes Yapı" },
      {
        name: "description",
        content: "Enes Yapı yönetim paneli hesabınız için yeni bir şifre belirleyin.",
      },
      { property: "og:title", content: "Yeni Şifre Belirle — Enes Yapı" },
      { property: "og:description", content: "Enes Yapı hesabınız için yeni şifre belirleme sayfası." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    if (password.length < 6) {
      setErrorText("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setErrorText("Şifreler birbiriyle aynı değil.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Şifreniz güncellendi.");
      navigate({ to: "/yonetim", replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      let msg = raw || "Bir hata oluştu.";
      if (/weak and easy to guess/i.test(raw)) {
        msg = "Bu şifre çok zayıf ve daha önce sızmış şifreler arasında. Lütfen daha güçlü bir şifre seçin.";
      } else if (/Auth session missing|session_not_found|invalid/i.test(raw)) {
        msg = "Sıfırlama bağlantısı geçersiz veya süresi geçmiş. Lütfen yeni bir bağlantı isteyin.";
      }
      setErrorText(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yeni şifre belirle</CardTitle>
          <CardDescription>
            {ready
              ? "Hesabınız için yeni bir şifre yazın."
              : "Şifre sıfırlama bağlantısı doğrulanıyor… Bu sayfayı e-postadaki bağlantıdan açtığınızdan emin olun."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorText ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {errorText}
            </div>
          ) : null}
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="new-password">Yeni şifre</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Yeni şifre (tekrar)</Label>
              <Input
                id="confirm-password"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !ready}>
              {loading ? "Kaydediliyor…" : "Şifreyi güncelle"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <Link to="/auth" className="text-muted-foreground underline">
              Giriş sayfasına dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
