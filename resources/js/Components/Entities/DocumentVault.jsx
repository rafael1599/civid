import React, { useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';

export default function DocumentVault({ documents, entity_id }) {
    const fileInput = useRef();
    const { props } = usePage();

    const { data, setData, post, processing, progress, reset } = useForm({
        file: null,
        entity_id: entity_id || null,
        name: ''
    });

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // In a real mobile app, we might want to ask for a name, 
        // but for Lean CRUD we'll just upload directly with the original name.
        const formData = new FormData();
        formData.append('file', file);
        if (entity_id) formData.append('entity_id', entity_id);

        post(route('documents.store'), {
            onSuccess: () => {
                reset();
                fileInput.current.value = '';
            },
            forceFormData: true,
        });
    };

    const triggerFileSelect = () => {
        fileInput.current.click();
    };

    if (!documents || documents.length === 0) {
        return (
            <div className="space-y-4">
                <input
                    type="file"
                    ref={fileInput}
                    onChange={handleUpload}
                    className="hidden"
                />
                <button
                    onClick={triggerFileSelect}
                    disabled={processing}
                    className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Subiendo... {progress && `${progress.percentage}%`}
                        </div>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Cargar Primer Documento
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
            <input
                type="file"
                ref={fileInput}
                onChange={handleUpload}
                className="hidden"
            />
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Bóveda de Documentos
                    </h3>
                    <button
                        onClick={triggerFileSelect}
                        disabled={processing}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline disabled:opacity-50"
                    >
                        {processing ? 'Subiendo...' : '+ Añadir'}
                    </button>
                </div>

                {progress && (
                    <div className="mb-4 bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                )}

                <div className="space-y-3">
                    {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg hover:border-indigo-100 border border-transparent transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{doc.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">
                                        {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'} • {new Date(doc.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`/storage/${doc.path}`}
                                target="_blank"
                                className="p-2 text-gray-300 hover:text-indigo-600 transition-colors flex-shrink-0"
                            >
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
