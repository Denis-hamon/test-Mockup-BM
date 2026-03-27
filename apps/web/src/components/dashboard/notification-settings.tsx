"use client";

import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  notifyNewCase: boolean;
  notifyNewMessage: boolean;
  onChange: (key: "notifyNewCase" | "notifyNewMessage", value: boolean) => void;
}

export function NotificationSettings({
  notifyNewCase,
  notifyNewMessage,
  onChange,
}: NotificationSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label className="text-sm">Nouveau dossier soumis</label>
        <Switch
          checked={notifyNewCase}
          onCheckedChange={(checked) => onChange("notifyNewCase", !!checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm">Nouveau message client</label>
        <Switch
          checked={notifyNewMessage}
          onCheckedChange={(checked) => onChange("notifyNewMessage", !!checked)}
        />
      </div>
    </div>
  );
}
