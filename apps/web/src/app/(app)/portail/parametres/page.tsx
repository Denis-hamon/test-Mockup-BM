"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function ParametresClientPage() {
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    newMessage: true,
    appointmentConfirm: true,
    appointmentReminder: true,
  });

  async function handleSave() {
    setSaving(true);
    try {
      // TODO: Wire to server action when available
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Parametres enregistres");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-[20px] font-semibold leading-[1.2]">Parametres</h1>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" placeholder="Nom" disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">Prenom</Label>
              <Input id="firstName" placeholder="Prenom" disabled />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" disabled />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input id="phone" type="tel" placeholder="Telephone" disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-message" className="flex-1">
              Nouveau message avocat
            </Label>
            <Switch
              id="notif-message"
              checked={notifications.newMessage}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, newMessage: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-appointment" className="flex-1">
              Confirmation rendez-vous
            </Label>
            <Switch
              id="notif-appointment"
              checked={notifications.appointmentConfirm}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  appointmentConfirm: checked,
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-reminder" className="flex-1">
              Rappel rendez-vous J-1
            </Label>
            <Switch
              id="notif-reminder"
              checked={notifications.appointmentReminder}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  appointmentReminder: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Securite</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">
                Phrase de recuperation
              </span>
              <span className="text-xs text-muted-foreground">
                Affichez votre phrase BIP39 pour sauvegarder vos cles
              </span>
            </div>
            <Button variant="outline" size="sm" disabled>
              Afficher
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">
                Exporter mes donnees
              </span>
              <span className="text-xs text-muted-foreground">
                Exportez toutes vos donnees au format JSON (RGPD)
              </span>
            </div>
            <Button variant="outline" size="sm" disabled>
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto sm:self-end"
      >
        {saving ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </div>
  );
}
