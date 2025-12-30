import React from 'react';

export default function RiskBanner({ alertStatus, nextUrgentEvent, onMarkAsPaid }) {
    if (alertStatus === 'SAFE') {
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
        <div className={`p-4 rounded-xl border ${styles[alertStatus]} flex flex-col md:flex-row items-center md:items-start justify-between gap-4 shadow-sm`}>
            <div className="flex items-start gap-4">
                <div className="mt-0.5">{icons[alertStatus]}</div>
                <div>
                    <p className="font-bold text-sm">
                        {alertStatus === 'CRITICAL' ? '¡Atención Urgente!' : 'Recordatorio de Pago'}
                    </p>
                    <p className="text-sm opacity-90">
                        {nextUrgentEvent.title} de <span className="font-bold">{nextUrgentEvent.entity_name}</span>
                        {nextUrgentEvent.days_left <= 0
                            ? ' está VENCIDO'
                            : ` vence en ${nextUrgentEvent.days_left} días`}
                        ({nextUrgentEvent.date}).
                    </p>
                    <p className="mt-1 font-bold text-sm">${Math.abs(nextUrgentEvent.amount).toLocaleString()}</p>
                </div>
            </div>

            <button
                onClick={() => onMarkAsPaid(nextUrgentEvent.id, nextUrgentEvent.amount)}
                className={`whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent rounded-lg font-bold text-xs text-white uppercase tracking-widest ${buttonStyles[alertStatus]} focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm`}
            >
                Marcar como Pagado
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </button>
        </div>
    );
}
