import ZenLayout from '@/Layouts/ZenLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ incomeCategories, expenseCategories }) {
    const [activeTab, setActiveTab] = useState('EXPENSE'); // EXPENSE or INCOME
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form for creating new category
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        type: 'EXPENSE',
        icon: '🏷️'
    });

    // Helper due to logic in controller passing them as separate props
    const categoriesToShow = activeTab === 'INCOME' ? incomeCategories : expenseCategories;

    const handleDelete = (id) => {
        if (confirm('¿Eliminar esta categoría?')) {
            router.delete(route('categories.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post(route('categories.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset('name');
            }
        });
    };

    const openCreateModal = () => {
        setData('type', activeTab); // Pre-fill type based on current tab
        setIsCreateModalOpen(true);
    }

    return (
        <ZenLayout>
            <Head title="Categorías" />

            <div className="pb-12">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Categorías</h1>
                    <button
                        onClick={openCreateModal}
                        className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Toggle Tabs */}
                <div className="bg-gray-100 p-1 rounded-2xl flex items-center mb-8 relative">
                    <button
                        onClick={() => setActiveTab('EXPENSE')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all z-10 ${activeTab === 'EXPENSE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Gastos
                    </button>
                    <button
                        onClick={() => setActiveTab('INCOME')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all z-10 ${activeTab === 'INCOME' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Ingresos
                    </button>
                </div>

                {/* Categories List */}
                <div className="space-y-3">
                    {categoriesToShow.map((category) => (
                        <div key={category.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${activeTab === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {category.metadata?.icon || '🏷️'}
                                </div>
                                <span className="font-bold text-gray-900">{category.name}</span>
                            </div>

                            <button
                                onClick={() => handleDelete(category.id)}
                                className="text-gray-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    {categoriesToShow.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-sm font-medium">No hay categorías de {activeTab === 'INCOME' ? 'ingresos' : 'gastos'} aún.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Simple Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Nueva Categoría de {activeTab === 'INCOME' ? 'Ingreso' : 'Gasto'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                    placeholder="Ej. Comida, Transporte..."
                                />
                                {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-black text-white font-bold py-4 rounded-xl mt-4 hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Guardando...' : 'Crear Categoría'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </ZenLayout>
    );
}
