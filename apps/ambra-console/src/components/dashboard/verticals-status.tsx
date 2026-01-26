
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const verticals = [
    { name: 'Educação Infantil', status: 'Operational' },
    { name: 'Ensino Fundamental', status: 'Operational' },
    { name: 'Cursos Livres', status: 'Degraded Performance' },
    { name: 'Ensino Superior', status: 'Under Maintenance' },
]

export function VerticalsStatus() {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Operational':
                return 'bg-green-500';
            case 'Degraded Performance':
                return 'bg-yellow-500';
            case 'Under Maintenance':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status das Verticais</CardTitle>
                <CardDescription>Status em tempo real dos sistemas de negócio.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {verticals.map(vertical => (
                        <div key={vertical.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", getStatusColor(vertical.status))} />
                                <span className="text-sm font-medium">{vertical.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{vertical.status}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
