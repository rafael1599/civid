import React from 'react';

export default function RecentActivity({ history, handleEditEvent, handleQuickFix, handleMarkAsPaid, isEventIncomplete, formatCurrency, formatDate, onTouchStart, onTouchMove, onTouchEnd, swipingId, swipeOffset, touchStart }) {
    return (
        <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">Actividad Reciente</h3>
            <div className="space-y-1">
                {history.map((event) => (
                    <div key={event.id} className="relative overflow-hidden rounded-2xl group">
                        {/* Delete Background */}
                        <div className="absolute inset-0 bg-rose-500 flex items-center px-6 text-white rounded-2xl">
                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest">Soltar para eliminar</span>
                        </div>

                        <div
                            onClick={() => handleEditEvent(event)}
                            onTouchStart={(e) => onTouchStart(e, event.id)}
                            onTouchMove={onTouchMove}
                            onTouchEnd={() => onTouchEnd(event)}
                            style={{
                                transform: swipingId === event.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                                transition: swipingId === event.id ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                touchAction: 'pan-y',
                            }}
                            className="relative z-10 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50/50 hover:border-gray-100 transition-colors cursor-pointer active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
                                    {event.type === 'INCOME' ? '↓' : '↑'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{event.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-medium">{formatDate(event.occurred_at)}</p>
                                        {event.entity?.name && (
                                            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[8px] font-bold uppercase rounded border border-gray-100/50">
                                                {event.entity.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isEventIncomplete(event) && (
                                    <button
                                        onClick={(e) => handleQuickFix(e, event)}
                                        className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors"
                                        title="Completar información"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                <p className={`text-sm font-black ${event.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {event.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(event.amount))}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
