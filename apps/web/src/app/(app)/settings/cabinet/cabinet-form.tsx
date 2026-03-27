"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateLawyerProfile } from "@/server/actions/lawyer-settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SpecialtySelector } from "@/components/dashboard/specialty-selector";
import { NotificationSettings } from "@/components/dashboard/notification-settings";

interface CabinetSettingsFormProps {
  initialProfile: {
    firmName: string | null;
    phone: string | null;
    specialties: string[];
    notifyNewCase: boolean;
    notifyNewMessage: boolean;
    readReceiptsEnabled: boolean;
  };
  email: string;
}

export function CabinetSettingsForm({
  initialProfile,
  email,
}: CabinetSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [firmName, setFirmName] = useState(initialProfile.firmName ?? "");
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [specialties, setSpecialties] = useState<string[]>(
    initialProfile.specialties
  );
  const [notifyNewCase, setNotifyNewCase] = useState(
    initialProfile.notifyNewCase
  );
  const [notifyNewMessage, setNotifyNewMessage] = useState(
    initialProfile.notifyNewMessage
  );
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(
    initialProfile.readReceiptsEnabled
  );

  function handleSave() {
    startTransition(async () => {
      const result = await updateLawyerProfile({
        firmName,
        phone,
        specialties,
        notifyNewCase,
        notifyNewMessage,
        readReceiptsEnabled,
      });
      if (result.success) {
        toast.success("Modifications enregistrees");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }

  function handleNotificationChange(
    key: "notifyNewCase" | "notifyNewMessage",
    value: boolean
  ) {
    if (key === "notifyNewCase") setNotifyNewCase(value);
    if (key === "notifyNewMessage") setNotifyNewMessage(value);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Card 1: Profil du cabinet */}
      <Card>
        <CardHeader>
          <CardTitle>Profil du cabinet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firmName">Nom du cabinet</Label>
            <Input
              id="firmName"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Mon cabinet"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Specialites juridiques */}
      <Card>
        <CardHeader>
          <CardTitle>Specialites juridiques</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecialtySelector
            selected={specialties}
            onChange={setSpecialties}
          />
        </CardContent>
      </Card>

      {/* Card 3: Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings
            notifyNewCase={notifyNewCase}
            notifyNewMessage={notifyNewMessage}
            onChange={handleNotificationChange}
          />
        </CardContent>
      </Card>

      {/* Card 4: Messagerie */}
      <Card>
        <CardHeader>
          <CardTitle>Messagerie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Accuses de lecture</Label>
              <p className="text-xs text-muted-foreground">
                Indiquer a vos clients quand vous avez lu leurs messages
              </p>
            </div>
            <Switch
              checked={readReceiptsEnabled}
              onCheckedChange={setReadReceiptsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        Enregistrer les modifications
      </Button>
    </div>
  );
}
