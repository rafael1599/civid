import React from 'react';

export default function AssetHealthWidget({ health }) {
    if (!health) return null;

    const isImminent = health.next_service && health.next_service.days_left <= 30;

    return (
        <div className={`mt-6 p-6 rounded-2xl border ${isImminent ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'} transition-all`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Salud del Activo (Odómetro Virtual)
                    </h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">{health.virtual_odometer.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">millas estimadas</span>
                    </div>
                </div>
                {health.next_service && (
                    <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{health.next_service.title}</p>
                        <p className={`text-sm font-black mt-1 ${isImminent ? 'text-amber-600' : 'text-gray-600'}`}>
                            {health.next_service.date}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                            en {health.next_service.days_left} días
                        </p>
                    </div>
                )}
            </div>
            {!health.next_service && (
                <p className="text-[10px] italic text-gray-400 mt-4">No hay servicios proyectados. Cuéntale al Omnibox cuando le hagas un servicio.</p>
            )}
        </div>
    );
}
