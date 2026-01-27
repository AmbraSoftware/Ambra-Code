"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HealthStatusCardProps = {
    title: string;
    value: string;
    status: 'Operational' | 'Healthy' | 'Optimized' | 'Valid' | 'Warning' | 'Critical';
    icon: React.ReactNode;
};

export function HealthStatusCard({ title, value, status, icon }: HealthStatusCardProps) {

    const getStatusVariant = (status: HealthStatusCardProps['status']) => {
        switch (status) {
            case 'Operational':
            case 'Healthy':
            case 'Optimized':
            case 'Valid':
                return "green";
            case 'Warning':
                return "yellow";
            case 'Critical':
                return "red";
            default:
                return "gray";
        }
    }

    const statusVariant = getStatusVariant(status);


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Badge className={cn(
                    "text-xs",
                    statusVariant === 'green' && "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300",
                    statusVariant === 'yellow' && "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300",
                    statusVariant === 'red' && "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive"
                )}>
                    {status}
                </Badge>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
                <div className="text-muted-foreground">
                    {icon}
                </div>
                <div className="text-2xl font-bold font-code">{value}</div>
            </CardContent>
        </Card>
    )
}
