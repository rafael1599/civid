import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import AssetCard from '@/Components/AssetCard';
import { useState } from 'react';

export default function Dashboard({ auth, total_balance, history, upcoming, assets, forecast }) {

    // --- Omnibox Logic ---
    const Omnibox = () => {
        const [input, setInput] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [draft, setDraft] = useState(null);

        const handleIngest = async (e) => {
            e.preventDefault();
            if (!input.trim()) return;

            setIsLoading(true);
            try {
                // Using axios directly or Inertia? Axios is better for async non-page-reloads usually, unless we want to use useForm.
                // Let's use axios for the lightweight "Draft" fetch.
                const response = await window.axios.post(route('ingest'), { prompt: input });
                if (response.data.success) {
                    setDraft(response.data.draft);
                }
            } catch (error) {
                console.error("Ingestion failed", error);
                alert("No pude procesar eso. Intenta de nuevo.");
            } finally {
                setIsLoading(false);
            }
        };

        const confirmDraft = async () => {
            setIsLoading(true);
            try {
                await window.axios.post(route('ingest.execute'), draft);
                // Refresh data using Inertia to show the new event in Activity
                window.location.reload(); // Simple reload for now to see immediate changes
                setDraft(null);
                setInput('');
            } catch (error) {
                console.error("Execution failed", error);
                alert("No pude guardar el evento.");
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <div className="relative">
                <form onSubmit={handleIngest} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Cuéntame o arrastra un recibo..."
                        className="w-full pl-5 pr-12 py-3 rounded-2xl border-none shadow-lg shadow-indigo-500/10 focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-xl text-sm font-medium text-gray-700 placeholder-gray-400 transition-all hover:bg-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                </form>

                {/* DRAFT MODAL - Autonomous Assessment */}
                {draft && (
                    <div className="absolute top-full mt-4 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-indigo-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    Interpretación Autónoma
                                </h4>
                                <p className="text-indigo-600 font-bold text-xs mt-1">Confianza: {Math.round(draft.confidence * 100)}%</p>
                            </div>
                            <button onClick={() => setDraft(null)} className="text-gray-300 hover:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                            <p className="text-sm font-medium text-gray-800 italic">"{draft.reasoning}"</p>
                        </div>

                        {draft.action !== 'UNKNOWN' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Acción</span>
                                    <span className="font-bold text-gray-900 bg-indigo-50 px-2 py-0.5 rounded text-xs uppercase tracking-wide">{draft.action}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                    <span className="text-gray-500">Entidad</span>
                                    <span className="font-bold text-gray-900">{draft.entity_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Monto / Fecha</span>
                                    <span className="font-bold text-gray-900">
                                        {draft.data.amount ? `$${Math.abs(draft.data.amount)}` : 'N/A'}
                                        <span className="text-gray-300 mx-2">|</span>
                                        {draft.data.occurred_at}
                                    </span>
                                </div>
                                <button
                                    onClick={confirmDraft}
                                    className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    Confirmar Acción
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-rose-500 text-sm font-bold">
                                No pude entender la intención. Intenta reformular.
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const EventItem = ({ event }) => (
        <div key={event.id} className="relative pl-12 flex items-center justify-between group">
            {/* Category Icon */}
            <div className={`absolute left-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 transition-all group-hover:scale-110 ${event.entity?.category === 'ASSET' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                }`}>
                {event.entity?.category === 'ASSET' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1V8a1 1 0 00-1-1h-4z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight truncate">{event.title}</p>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">
                        {event.entity?.name || 'Sistema'}
                    </p>
                    <span className="text-[10px] text-gray-200">•</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        {new Date(event.occurred_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="text-right ml-4">
                <p className={`font-black text-sm tracking-tight ${parseFloat(event.amount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {parseFloat(event.amount) > 0 ? '+' : ''}${Math.abs(event.amount).toLocaleString()}
                </p>
                {event.status === 'PAID' && (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Pagado</span>
                )}
            </div>
        </div>
    );

    const getUrgencyColor = (days) => {
        if (days < 3) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (days < 7) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-gray-500 bg-gray-50 border-gray-100';
    };

    const getRelativeDateLabel = (days) => {
        if (days === 0) return 'Hoy';
        if (days === 1) return 'Mañana';
        if (days < 0) return `Vencido (${Math.abs(days)}d)`;
        return `en ${days} días`;
    };
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 md:px-0">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div>
                            <h2 className="text-2xl font-black leading-tight text-gray-900 tracking-tight">
                                Hola, {auth.user.name.split(' ')[0]}
                            </h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Estado Vital y Financiero</p>
                        </div>
                        {/* Mobile Avatar */}
                        <div className="md:hidden relative ml-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                {auth.user.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                    </div>

                    {/* OMNIBOX - The Autonomy Interface */}
                    <div className="w-full md:max-w-md relative z-50">
                        <Omnibox />
                    </div>

                    {/* Desktop Avatar */}
                    <div className="hidden md:block relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                            {auth.user.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6 md:py-12 bg-gray-50/50 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8">

                    {/* Hero Balance Card */}
                    <div className="mx-4 md:mx-0 bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center">
                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-2">Net Worth Estimado</p>
                            <h3 className="text-5xl md:text-6xl font-black tracking-tighter mb-1">
                                ${parseFloat(total_balance).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[10px] font-bold">+2.4% este mes</span>
                            </div>
                        </div>
                        {/* Abstract background shapes */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    </div>

                    {/* Radar Widget: 30-Day Forecast */}
                    <div className="mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Liquidity Target */}
                        <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                    Radar de Liquidez
                                </p>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                                    Necesitas <span className="text-indigo-600">${Math.round(forecast.projected_amount).toLocaleString()}</span>
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-1">Para cubrir los próximos 30 días</p>
                            </div>
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                        </div>

                        {/* Upcoming Bills List */}
                        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Próximos Compromisos
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {forecast.upcoming_bills.slice(0, 3).map((bill) => (
                                    <div key={bill.id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 flex flex-col justify-between hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all cursor-default group">
                                        <div>
                                            <p className="font-bold text-gray-900 text-xs leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">{bill.entity_name}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getUrgencyColor(bill.days_left)}`}>
                                                {getRelativeDateLabel(bill.days_left)}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <p className="text-sm font-black text-gray-900 tracking-tight">${Math.round(Math.abs(bill.amount)).toLocaleString()}</p>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-200 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                                {forecast.upcoming_bills.length === 0 && (
                                    <div className="col-span-full py-4 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        Sin pagos pendientes
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Assets Section */}
                    <div className="px-4 md:px-0">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Mis Activos
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100">Ver Todos</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assets && assets.length > 0 ? (
                                assets.map(asset => (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 font-bold text-sm">
                                    Sin activos registrados
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Split Activity View */}
                    <div className="mx-4 md:mx-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 1. History Card */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-[2rem] border border-gray-100 p-8 flex flex-col h-full">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Lo que ha pasado
                            </h3>

                            {history.length > 0 ? (
                                <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-50/50 flex-1">
                                    {history.map((event) => (
                                        <EventItem key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 font-bold text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                    Sin historial reciente.
                                </div>
                            )}
                        </div>

                        {/* 2. Upcoming Card */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-[2rem] border border-gray-100 p-8 flex flex-col h-full">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                Lo que viene
                            </h3>

                            {upcoming.length > 0 ? (
                                <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-50/50 flex-1">
                                    {upcoming.map((event) => (
                                        <EventItem key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400 font-bold text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-100">
                                    No hay eventos futuros programados.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
