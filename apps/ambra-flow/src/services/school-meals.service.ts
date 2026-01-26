import { api } from './api';
import { canteenService } from './canteen.service';

export interface DailyMenu {
    id: string;
    canteenId: string;
    date: string;
    items: {
        lunch?: string;
        snack?: string;
        dessert?: string;
        [key: string]: string | undefined;
    };
    nutritionalInfo?: {
        calories?: number;
        allergens?: string[];
        [key: string]: any;
    };
    createdAt: string;
}

export const schoolMealsService = {
    // Get weekly menu for a specific canteen
    getWeeklyMenu: async (canteenId: string, start: Date, end: Date) => {
        const { data } = await api.get<DailyMenu[]>(`/canteen/${canteenId}/menu`, {
            params: {
                start: start.toISOString(),
                end: end.toISOString()
            }
        });
        return data;
    },

    // Create or update menu for a specific day
    setDailyMenu: async (canteenId: string, date: Date, items: any, nutritionalInfo?: any) => {
        const { data } = await api.post<DailyMenu>(`/canteen/${canteenId}/menu`, {
            date: date.toISOString(),
            items,
            nutritionalInfo
        });
        return data;
    }
};
