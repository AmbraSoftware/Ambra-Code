'use client';

import { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, addDays, format, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { canteenService, Canteen } from '@/services/canteen.service';
import { schoolMealsService, DailyMenu } from '@/services/school-meals.service';

export default function SchoolMealsPage() {
    const [canteens, setCanteens] = useState<Canteen[]>([]);
    const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeklyMenus, setWeeklyMenus] = useState<DailyMenu[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDate, setEditingDate] = useState<Date | null>(null);
    const [formData, setFormData] = useState({
        lunch: '',
        snack: '',
        dessert: '',
        calories: '',
        allergens: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadCanteens();
    }, []);

    useEffect(() => {
        if (selectedCanteenId) {
            loadWeeklyMenu();
        }
    }, [selectedCanteenId, currentDate]);

    const loadCanteens = async () => {
        try {
            const data = await canteenService.findAll();
            setCanteens(data);
            if (data.length > 0) {
                setSelectedCanteenId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load canteens', error);
        }
    };

    const loadWeeklyMenu = async () => {
        if (!selectedCanteenId) return;
        setLoading(true);
        try {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });     // Sunday
            const data = await schoolMealsService.getWeeklyMenu(selectedCanteenId, start, end);
            setWeeklyMenus(data);
        } catch (error) {
            console.error('Failed to load menu', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (date: Date, menu?: DailyMenu) => {
        setEditingDate(date);
        setFormData({
            lunch: menu?.items?.lunch || '',
            snack: menu?.items?.snack || '',
            dessert: menu?.items?.dessert || '',
            calories: menu?.nutritionalInfo?.calories?.toString() || '',
            allergens: menu?.nutritionalInfo?.allergens?.join(', ') || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCanteenId || !editingDate) return;
        
        setIsSubmitting(true);
        try {
            await schoolMealsService.setDailyMenu(
                selectedCanteenId,
                editingDate,
                {
                    lunch: formData.lunch,
                    snack: formData.snack,
                    dessert: formData.dessert
                },
                {
                    calories: formData.calories ? parseInt(formData.calories) : undefined,
                    allergens: formData.allergens ? formData.allergens.split(',').map(s => s.trim()) : []
                }
            );
            await loadWeeklyMenu();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save menu', error);
            alert('Erro ao salvar cardápio.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const weekDays = Array.from({ length: 5 }).map((_, i) => 
        addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
    );

    const getMenuForDate = (date: Date) => {
        return weeklyMenus.find(m => isSameDay(new Date(m.date), date));
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Merenda Escolar</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Planejamento do cardápio semanal e informações nutricionais.</p>
                </div>
                
                {canteens.length > 1 && (
                    <select 
                        className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm"
                        value={selectedCanteenId || ''}
                        onChange={(e) => setSelectedCanteenId(e.target.value)}
                    >
                        {canteens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
            </div>

            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800">
                <Button variant="ghost" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                    <span className="material-symbols-outlined">chevron_left</span>
                    Semana Anterior
                </Button>
                <div className="text-center">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Semana de {format(weekDays[0], 'dd/MM')} a {format(weekDays[4], 'dd/MM')}
                    </p>
                </div>
                <Button variant="ghost" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                    Próxima Semana
                    <span className="material-symbols-outlined">chevron_right</span>
                </Button>
            </div>

            {loading ? (
                 <div className="p-12 text-center text-gray-500">Carregando cardápio...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {weekDays.map(date => {
                        const menu = getMenuForDate(date);
                        const isToday = isSameDay(date, new Date());
                        
                        return (
                            <Card key={date.toISOString()} className={`flex flex-col h-full ${isToday ? 'border-primary ring-1 ring-primary' : ''}`}>
                                <div className="p-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 rounded-t-lg">
                                    <span className="text-xs font-medium text-gray-500 uppercase block">
                                        {format(date, 'EEEE', { locale: ptBR })}
                                    </span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {format(date, 'dd')}
                                    </span>
                                </div>
                                
                                <div className="p-4 flex-1 space-y-4">
                                    {menu ? (
                                        <>
                                            {menu.items.lunch && (
                                                <div>
                                                    <span className="text-xs font-bold text-orange-600 uppercase block mb-1">Almoço</span>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{menu.items.lunch}</p>
                                                </div>
                                            )}
                                            {menu.items.snack && (
                                                <div>
                                                    <span className="text-xs font-bold text-blue-600 uppercase block mb-1">Lanche</span>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{menu.items.snack}</p>
                                                </div>
                                            )}
                                            {menu.nutritionalInfo?.calories && (
                                                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-zinc-700">
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                                                        {menu.nutritionalInfo.calories} kcal
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                            Sem cardápio
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 mt-auto border-t border-gray-100 dark:border-zinc-800">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => handleOpenModal(date, menu)}
                                    >
                                        {menu ? 'Editar' : 'Adicionar'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Cardápio de ${editingDate ? format(editingDate, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}`}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-4">
                        <Input
                            label="Almoço (Prato Principal)"
                            placeholder="Ex: Arroz, Feijão, Frango Grelhado e Salada"
                            value={formData.lunch}
                            onChange={e => setFormData({...formData, lunch: e.target.value})}
                        />
                        <Input
                            label="Lanche / Sobremesa"
                            placeholder="Ex: Maçã e Iogurte"
                            value={formData.snack}
                            onChange={e => setFormData({...formData, snack: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Calorias (kcal)"
                                type="number"
                                placeholder="450"
                                value={formData.calories}
                                onChange={e => setFormData({...formData, calories: e.target.value})}
                            />
                            <Input
                                label="Alérgenos (separar por vírgula)"
                                placeholder="Glúten, Leite"
                                value={formData.allergens}
                                onChange={e => setFormData({...formData, allergens: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={isSubmitting}>Salvar Cardápio</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
