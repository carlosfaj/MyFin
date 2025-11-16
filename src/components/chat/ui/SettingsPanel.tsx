import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";

export default function SettingsPanel({
  profileName,
  setProfileName,
  saveProfile,
}: {
  profileName: string;
  setProfileName: (v: string) => void;
  saveProfile: (name?: string) => Promise<void> | void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Tu nombre"
          />
          <Button
            variant="secondary"
            disabled={!profileName.trim()}
            onClick={async () => await saveProfile(profileName)}
          >
            Guardar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">El asistente usará este nombre en sus respuestas.</p>
      </CardContent>
    </Card>
  );
}
