import React from 'react';

export default function DocumentVault({ documents }) {
    if (!documents || documents.length === 0) {
        return (
            <button className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Cargar Primer Documento
            </button>
        );
    }

    return (
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
                    {documents.map(doc => (
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
    );
}
