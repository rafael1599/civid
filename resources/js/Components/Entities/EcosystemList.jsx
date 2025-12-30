import React from 'react';
import { Link } from '@inertiajs/react';

export default function EcosystemList({ children, isAsset }) {
    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100 p-6 md:p-8">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {isAsset ? 'Ecosistema de Apoyo' : 'Vinculado a'}
            </h3>

            {children && children.length > 0 ? (
                <div className="space-y-4">
                    {children.map(child => (
                        <div key={child.id}>
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
                                        {child.category}
                                    </p>
                                </div>
                            </Link>
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
    );
}
