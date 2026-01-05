import ZenLayout from '@/Layouts/ZenLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ assets, vault, ecosystem, entities }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('DOCUMENTS'); // 'DOCUMENTS' or 'ECOSYSTEM'

    const filteredAssets = (assets || []).filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.documents.some(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <ZenLayout>
            <Head title="La Bóveda" />

            <div className="space-y-10">
                {/* Header & Toggle */}
                <header className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">La Bóveda</h1>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Documentación y Activos Críticos</p>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button
                                onClick={() => setViewMode('DOCUMENTS')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'DOCUMENTS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Archivos
                            </button>
                            <button
                                onClick={() => setViewMode('ECOSYSTEM')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ECOSYSTEM' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Ecosistema
                            </button>
                        </div>
                    </div>

                    {viewMode === 'DOCUMENTS' && (
                        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                            <input
                                type="text"
                                placeholder="Buscar activos o documentos..."
                                className="w-full bg-white border-none rounded-3xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-black text-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    )}
                </header>

                {viewMode === 'DOCUMENTS' ? (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Assets Grid */}
                        <div className="grid grid-cols-1 gap-8">
                            {filteredAssets.length > 0 ? (
                                filteredAssets.map((asset) => (
                                    <section key={asset.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{asset.name}</h2>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{asset.metadata?.model || asset.metadata?.brand || 'Activo Registrado'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900">{formatCurrency(asset.metadata?.value || 0)}</p>
                                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Valor de Mercado</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                {Object.entries(asset.metadata || {}).filter(([key]) => !['value', 'model', 'brand'].includes(key)).slice(0, 3).map(([key, value]) => (
                                                    <div key={key} className="bg-white px-3 py-1.5 rounded-xl border border-gray-100/50 shadow-sm">
                                                        <p className="text-[8px] font-black text-gray-300 uppercase leading-none mb-1">{key}</p>
                                                        <p className="text-[10px] font-bold text-gray-700 leading-none">{String(value)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Archivos Adjuntos ({asset.documents?.length || 0})</h3>
                                            </div>

                                            {asset.documents && asset.documents.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {asset.documents.map((doc) => (
                                                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer group">
                                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm group-hover:text-black transition-colors">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] font-bold text-gray-900 truncate">{doc.name}</p>
                                                                <p className="text-[8px] text-gray-400 uppercase font-bold">{doc.created_at}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 bg-gray-25 rounded-2xl border border-dashed border-gray-100">
                                                    <p className="text-[10px] text-gray-300 font-bold uppercase">Sin documentos vinculados</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 text-sm font-medium">No se encontraron activos o documentos.</p>
                                </div>
                            )}
                        </div>

                        {/* Other Documents (Unlinked) */}
                        {Object.keys(vault).length > 0 && (
                            <section className="space-y-6 pt-10 border-t border-gray-100">
                                <div className="px-1">
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Otros Documentos</h2>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">Archivos generales y recibos del sistema</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(vault).map(month => (
                                        vault[month].filter(doc => !doc.entity_id || assets.every(a => a.id !== doc.entity_id)).map(doc => (
                                            <div key={doc.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 group hover:border-gray-200 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-indigo-400 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-gray-900 truncate">{doc.name}</p>
                                                        <p className="text-[8px] text-gray-400 uppercase font-bold">{doc.created_at}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    /* Mundo B: The Ecosystem (Relocated from Dashboard) */
                    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
                        <div className="grid grid-cols-1 gap-4">
                            {ecosystem.map((entity) => (
                                <div key={entity.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex flex-col gap-6 shadow-sm relative overflow-hidden">
                                    {/* Risk Indicator */}
                                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                                        <div className={`w-2 h-2 rounded-full ${entity.status === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                                            entity.status === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}></div>
                                        <span className="text-[8px] font-black lowercase tracking-widest text-gray-500">{entity.status}</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl font-black text-gray-900 border border-gray-100">
                                            {entity.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{entity.name}</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{entity.category}</p>
                                        </div>
                                    </div>

                                    {entity.connections && entity.connections.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">Vinculado a:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {entity.connections.map((conn, idx) => {
                                                    const targetEntity = entities.find(e => e.id === conn.target);
                                                    return (
                                                        <div key={idx} className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-gray-700">{targetEntity?.name || 'Carga...'}</span>
                                                            <span className="text-[8px] font-black text-gray-300 uppercase">{conn.type}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </ZenLayout>
    );
}
