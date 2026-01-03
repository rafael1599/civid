import ZenLayout from '@/Layouts/ZenLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ vault }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVault = Object.keys(vault).reduce((acc, month) => {
        const filteredDocs = vault[month].filter(doc =>
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.entity_name && doc.entity_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (filteredDocs.length > 0) {
            acc[month] = filteredDocs;
        }
        return acc;
    }, {});

    return (
        <ZenLayout>
            <Head title="The Vault" />

            <div className="space-y-8">
                {/* Search Bar */}
                <section>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar en la bóveda..."
                            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </section>

                {/* Document Grid */}
                {Object.keys(filteredVault).length > 0 ? (
                    Object.keys(filteredVault).map((month) => (
                        <section key={month}>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">{month}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {filteredVault[month].map((doc) => (
                                    <div key={doc.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 group">
                                        {/* Thumbnail Placeholder */}
                                        <div className="aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 transition-colors">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{doc.created_at}</p>

                                            {/* Contextual Link */}
                                            {doc.event_title && (
                                                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1">
                                                    <span className="text-[8px] text-indigo-500 font-bold uppercase">Relación:</span>
                                                    <span className="text-[8px] text-gray-500 truncate">{doc.event_title}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-sm">No hay documentos que coincidan.</p>
                    </div>
                )}
            </div>
        </ZenLayout>
    );
}
