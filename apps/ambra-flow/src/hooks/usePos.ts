import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { Product } from '@/services/stock.service';

export function usePosProducts() {
    return useQuery({
        queryKey: ['pos-products'],
        queryFn: posService.getProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes stale time (cache is fresh for 5m)
        gcTime: 1000 * 60 * 60 * 24, // Keep in garbage collection for 24h (offline support)
        refetchOnWindowFocus: false,
        retry: 2
    });
}
