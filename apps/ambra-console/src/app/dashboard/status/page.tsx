"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Status"
        description="Visão geral de saúde do ecossistema."
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

