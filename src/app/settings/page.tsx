"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const [form, setForm] = useState({ biz_name:"", biz_email:"", biz_phone:"", biz_address:"", biz_city:"", biz_state:"", biz_zip:"", biz_payment_terms:"" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => setForm(f => ({ ...f, ...data })));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Business Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><Label>Business Name</Label><Input value={form.biz_name} onChange={set("biz_name")} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.biz_email} onChange={set("biz_email")} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.biz_phone} onChange={set("biz_phone")} /></div>
              <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.biz_address} onChange={set("biz_address")} /></div>
              <div className="space-y-1"><Label>City</Label><Input value={form.biz_city} onChange={set("biz_city")} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>State</Label><Input value={form.biz_state} onChange={set("biz_state")} /></div>
                <div className="space-y-1"><Label>Zip</Label><Input value={form.biz_zip} onChange={set("biz_zip")} /></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Defaults</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label>Payment Terms</Label>
              <Textarea value={form.biz_payment_terms} onChange={set("biz_payment_terms")} placeholder="e.g. Net 30. Payment by bank transfer..." rows={3} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit">{saved ? "Saved!" : "Save Settings"}</Button>
      </form>
    </div>
  );
}
