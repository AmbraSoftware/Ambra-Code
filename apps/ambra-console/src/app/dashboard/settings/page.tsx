"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configurações gerais do Console."
      />
      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área está em construção.
        </CardContent>
      </Card>
    </div>
  );
}

