import React from 'react';
import { router } from '@inertiajs/react';

export default function ActivityTimeline({ events, onEdit, onDelete }) {
    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
            <div className="p-6 md:p-8">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Historial de Actividad
                </h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-50">
                    {events && events.map(event => (
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
                                            className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Deshacer Pago"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onEdit && onEdit(event)}
                                        className="p-1 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Editar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete && onDelete(event.id)}
                                        className="p-1 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
