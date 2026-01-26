import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Inbox } from "lucide-react";

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
}

export function Table<T>({
    data,
    columns,
    keyExtractor,
    isLoading = false,
    emptyMessage = "Nenhum dado encontrado.",
    onRowClick,
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full p-8 flex justify-center items-center">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="w-full p-12 flex flex-col items-center justify-center text-muted-light dark:text-muted-dark border rounded-lg border-dashed border-border-light dark:border-border-dark">
                <Inbox className="w-10 h-10 mb-2 opacity-50" />
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-border-light dark:border-border-dark">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-black/20 border-b border-border-light dark:border-border-dark">
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                scope="col"
                                className={cn(
                                    "px-6 py-4 font-semibold text-muted-light dark:text-muted-dark uppercase tracking-wider text-xs",
                                    col.align === "right"
                                        ? "text-right"
                                        : col.align === "center"
                                            ? "text-center"
                                            : "text-left"
                                )}
                                style={{ width: col.width }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                    {data.map((item) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={() => onRowClick && onRowClick(item)}
                            className={cn(
                                "transition-colors",
                                onRowClick
                                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                                    : ""
                            )}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={colIdx}
                                    className={cn(
                                        "px-6 py-4 text-text-light dark:text-text-dark",
                                        col.align === "right"
                                            ? "text-right"
                                            : col.align === "center"
                                                ? "text-center"
                                                : "text-left"
                                    )}
                                >
                                    {col.cell
                                        ? col.cell(item)
                                        : col.accessorKey
                                            ? String(item[col.accessorKey])
                                            : "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
