import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import LinkEntityModal from '@/Components/LinkEntityModal';

export default function Show({ auth, entity, alert_status, next_urgent_event }) {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    const handleUnlink = (childId) => {
        if (confirm('¿Estás seguro de que quieres desvincular esta entidad?')) {
            router.delete(route('entities.relationships.destroy', [entity.id, childId]), {
                preserveScroll: true,
            });
        }
    };

    const handleMarkAsPaid = (eventId, amount) => {
        if (confirm(`¿Confirmas que pagaste $${Math.abs(amount).toLocaleString()} hoy?`)) {
            router.post(route('events.mark-as-paid', eventId), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    // Semáforo se actualizará con el reload de Inertia
                }
            });
        }
    };

    const RiskBanner = () => {
        if (alert_status === 'SAFE') {
            return (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 self-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Todo al día
                </div>
            );
        }

        const styles = {
            CRITICAL: 'bg-red-50 border-red-100 text-red-800',
            WARNING: 'bg-amber-50 border-amber-100 text-amber-800',
        };

        const buttonStyles = {
            CRITICAL: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            WARNING: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        };

        const icons = {
            CRITICAL: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            ),
            WARNING: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
            ),
        };

        return (
            <div className={`p-4 rounded-xl border ${styles[alert_status]} flex flex-col md:flex-row items-center md:items-start justify-between gap-4 shadow-sm`}>
                <div className="flex items-start gap-4">
                    <div className="mt-0.5">{icons[alert_status]}</div>
                    <div>
                        <p className="font-bold text-sm">
                            {alert_status === 'CRITICAL' ? '¡Atención Urgente!' : 'Recordatorio de Pago'}
                        </p>
                        <p className="text-sm opacity-90">
                            {next_urgent_event.title} de <span className="font-bold">{next_urgent_event.entity_name}</span>
                            {next_urgent_event.days_left <= 0
                                ? ' está VENCIDO'
                                : ` vence en ${next_urgent_event.days_left} días`}
                            ({next_urgent_event.date}).
                        </p>
                        <p className="mt-1 font-bold text-sm">${Math.abs(next_urgent_event.amount).toLocaleString()}</p>
                    </div>
                </div>

                <button
                    onClick={() => handleMarkAsPaid(next_urgent_event.id, next_urgent_event.amount)}
                    className={`whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent rounded-lg font-bold text-xs text-white uppercase tracking-widest ${buttonStyles[alert_status]} focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm`}
                >
                    Marcar como Pagado
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            </div>
        );
    };

    const isAsset = entity.category === 'ASSET';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center px-4 md:px-0">
                    <div className="flex items-center gap-3">
                        <Link href={route('dashboard')} className="text-gray-400 hover:text-indigo-600 bg-white p-2 rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black leading-tight text-gray-900 tracking-tight">
                                {entity.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isAsset ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {entity.category}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• {entity.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={entity.name} />

            <div className="py-6 md:py-12 bg-gray-50/50 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6 md:space-y-8">

                    {/* Risk Semaphore - Always at top if not safe */}
                    {alert_status !== 'SAFE' && (
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mx-4 md:mx-0">
                            <RiskBanner />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6 md:space-y-8">

                            {/* Level 1: Asset Hero / Level 2: Financial Stats */}
                            {isAsset ? (
                                <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
                                    <div className="p-6 md:p-8">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                            Especificaciones Técnicas
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {entity.metadata && Object.entries(entity.metadata)
                                                .filter(([k]) => k !== 'image_url')
                                                .map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{key.replace('_', ' ')}</p>
                                                        <p className="font-bold text-gray-900 truncate">{String(value)}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Saldo Pendiente</p>
                                            <h3 className="text-4xl md:text-5xl font-black text-center md:text-left tracking-tighter">
                                                ${(entity.metadata?.balance || 0).toLocaleString()}
                                            </h3>
                                            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                                <div className="text-center md:text-left">
                                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Cuenta</p>
                                                    <p className="font-mono text-sm opacity-80">{entity.metadata?.account_number || 'N/A'}</p>
                                                </div>
                                                <div className="text-center md:text-right">
                                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Próx. Pago</p>
                                                    <p className="font-bold text-sm text-amber-400">{entity.metadata?.payment || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Decorative background circle */}
                                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                    </div>

                                    {/* Smart Recurrence: Freedom Date & Progress */}
                                    {entity.metadata?.remaining_payments !== undefined && (
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${parseInt(entity.metadata.remaining_payments) === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Progreso de Deuda</p>
                                                    <p className="text-xl font-black text-gray-900">
                                                        {parseInt(entity.metadata.remaining_payments) === 0
                                                            ? '¡Deuda Saldada!'
                                                            : `${entity.metadata.remaining_payments} Pagos Restantes`}
                                                    </p>
                                                </div>
                                            </div>

                                            {parseInt(entity.metadata.remaining_payments) > 0 && (
                                                <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                                    <span className="text-xl">🎉</span>
                                                    <div>
                                                        <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Libertad Financiera Estimada</p>
                                                        <p className="text-sm font-bold text-emerald-700 capitalize">
                                                            {new Date(new Date().setMonth(new Date().getMonth() + parseInt(entity.metadata.remaining_payments))).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Financial Health & Amortization */}
                                    {entity.metadata?.original_principal && (
                                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    Salud Financiera de la Deuda
                                                </h3>
                                                {entity.metadata?.savings_accumulated > 0 && (
                                                    <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                                        ${Math.round(entity.metadata.savings_accumulated).toLocaleString()} Ahorrados
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {/* Progress Bar */}
                                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div
                                                        className="bg-indigo-600 h-full transition-all duration-1000"
                                                        style={{ width: `${Math.round(((entity.metadata.original_principal - (entity.metadata.remaining_principal || 0)) / entity.metadata.original_principal) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                                    <div className="text-indigo-600">Pagado: ${Math.round(entity.metadata.original_principal - (entity.metadata.remaining_principal || 0)).toLocaleString()}</div>
                                                    <div className="text-gray-400 text-center">Deuda: ${Math.round(entity.metadata.remaining_principal || 0).toLocaleString()}</div>
                                                    <div className="text-gray-300 text-right">Crédito: ${Math.round(entity.metadata.original_principal).toLocaleString()}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Intereses Pagados</p>
                                                    <p className="text-lg font-bold text-rose-500">${(entity.metadata?.interest_paid_to_date || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Ahorro Estimado</p>
                                                    <p className="text-lg font-bold text-emerald-500">${(entity.metadata?.savings_accumulated || 0).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <button className="w-full py-4 bg-amber-50 text-amber-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border-2 border-dashed border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-2 group">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Registrar Abono a Capital
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bóveda de Documentos - Collapsible if empty */}
                            {(entity.documents && entity.documents.length > 0) ? (
                                <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
                                    <div className="p-6 md:p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Bóveda de Documentos
                                            </h3>
                                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Añadir</button>
                                        </div>

                                        <div className="space-y-3">
                                            {entity.documents.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg hover:border-indigo-100 border border-transparent transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{doc.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <a href={doc.path} target="_blank" className="p-2 text-gray-300 hover:text-indigo-600 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Cargar Primer Documento
                                </button>
                            )}

                            {/* Historial de Eventos - Contextual */}
                            <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
                                <div className="p-6 md:p-8">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        Historial de Actividad
                                    </h3>
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-50">
                                        {entity.life_events && entity.life_events.map(event => (
                                            <div key={event.id} className="relative pl-10">
                                                <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ring-gray-50/50 ${event.status === 'PAID' ? 'bg-emerald-500' : (event.status === 'SCHEDULED' ? 'bg-amber-500' : 'bg-gray-300')
                                                    }`}></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm leading-tight">{event.title}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                            {new Date(event.occurred_at).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                            <span className="mx-2 opacity-30">•</span>
                                                            <span className="text-indigo-500">{event.context_label}</span>
                                                            {event.status && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[9px]">{event.status}</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className={`font-black text-sm ${event.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {event.amount < 0 ? '-' : '+'}${Math.abs(event.amount).toLocaleString()}
                                                        </p>
                                                        {event.status === 'PAID' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('¿Revertir este pago y restaurar la deuda?')) {
                                                                        router.post(route('events.undo', event.id));
                                                                    }
                                                                }}
                                                                className="p-1.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="Deshacer Pago"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Connections / Ecosystem */}
                        <div className="space-y-6 md:space-y-8">
                            <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100 p-6 md:p-8">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    {isAsset ? 'Ecosistema de Apoyo' : 'Vinculado a'}
                                </h3>

                                {entity.children && entity.children.length > 0 ? (
                                    <div className="space-y-4">
                                        {entity.children.map(child => (
                                            <div key={child.id} className="relative group">
                                                <Link
                                                    href={route('entities.show', child.id)}
                                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all"
                                                >
                                                    <div className={`p-2 rounded-xl shadow-sm border border-gray-100 ${child.category === 'FINANCE' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                                        }`}>
                                                        {child.category === 'FINANCE' ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{child.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">
                                                            {child.pivot.relationship_type.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={() => handleUnlink(child.id)}
                                                    className="absolute -top-1 -right-1 p-1.5 bg-white rounded-full text-gray-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-gray-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-300 mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.102-1.101" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sin conexiones secundarias</p>
                                        <button className="mt-4 px-4 py-2 bg-white border border-gray-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest rounded-xl shadow-sm active:scale-95 transition-all">
                                            Vincular Ahora
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
