import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function GlobalOmnibox({ isOpen, onClose }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [manualUploadMode, setManualUploadMode] = useState(false);
    const [stagedFile, setStagedFile] = useState(null);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [documentName, setDocumentName] = useState('');
    const [draft, setDraft] = useState(null);
    const [sysFeedback, setSysFeedback] = useState(null);
    const [entities, setEntities] = useState([]); // Local state for entities
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const retractTimerRef = useRef(null);

    // Auto-focus when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Cleanup timer on unmount or re-open
    useEffect(() => {
        return () => {
            if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        };
    }, []);

    const startRetractTimer = (seconds = 5) => {
        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        retractTimerRef.current = setTimeout(() => {
            onClose();
            // Reset states after closing
            setDraft(null);
            setSysFeedback(null);
            setInput('');
        }, seconds * 1000);
    };

    // Minimize on mobile scroll? maybe later. For now always visible.

    // Lazy load entities for manual mode
    useEffect(() => {
        if (manualUploadMode && entities.length === 0) {
            window.axios.get(route('api.entities.index')) // Need to ensure this endpoint exists or create it
                .then(res => setEntities(res.data))
                .catch(err => console.error("Failed to load entities", err));
        }
    }, [manualUploadMode]);

    const handleIngest = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        setDraft(null);
        setSysFeedback(null);
        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);


        try {
            const response = await window.axios.post(route('ingest'), { prompt: input });
            if (response.data.success) {
                if (response.data.auto_executed) {
                    setSysFeedback({ type: 'success', message: response.data.message });
                    setInput('');
                    startRetractTimer(5);
                } else {
                    setDraft(response.data.draft);
                }
            }
        } catch (error) {
            console.error("Ingestion failed", error);
            if (error.response?.status === 419) {
                setSysFeedback({ type: 'error', message: "Sesión expirada. Recarga la página." });
            } else if (error.response?.status === 422) {
                setSysFeedback({
                    type: 'info',
                    message: error.response.data.message,
                    suggestions: error.response.data.suggestions || []
                });
            } else {
                setSysFeedback({ type: 'error', message: "No pude procesar eso." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDraft = () => {
        setIsLoading(true);
        if (!draft?.actions?.length) return;

        router.post(route('ingest.execute'), { actions: draft.actions }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setDraft(null);
                setSysFeedback({ type: 'success', message: 'Ejecutado correctamente.' });
                setInput('');
                setIsLoading(false);
                startRetractTimer(5);
            },
            onError: (errors) => {
                setSysFeedback({ type: 'error', message: "Error: " + Object.values(errors).join(", ") });
                setIsLoading(false);
            }
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (manualUploadMode) {
            setStagedFile(file);
            setDocumentName(file.name);
            return;
        }

        setIsLoading(true);
        setDraft(null);
        setSysFeedback(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await window.axios.post(route('ingest'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                if (response.data.auto_executed) {
                    setSysFeedback({ type: 'success', message: response.data.message });
                    startRetractTimer(5);
                } else {
                    setDraft(response.data.draft);
                }
            }
        } catch (error) {
            setSysFeedback({ type: 'error', message: "Error al subir archivo." });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleManualUpload = async (e) => {
        e?.preventDefault();
        if (!stagedFile || !selectedEntityId) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', stagedFile);
        formData.append('entity_id', selectedEntityId);
        formData.append('name', documentName);

        try {
            await window.axios.post(route('documents.store'), formData);
            setStagedFile(null);
            setManualUploadMode(false);
            setSysFeedback({ type: 'success', message: 'Documento guardado.' });
            setIsLoading(false);
            startRetractTimer(3);
        } catch (error) {
            setSysFeedback({ type: 'error', message: "Error al guardar documento." });
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end items-center p-4 pb-24 pointer-events-none">
            {/* Backdrop to close */}
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px] pointer-events-auto" onClick={onClose}></div>

            <div className="relative w-full max-w-xl pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
                {/* Chat interfaces */}
                <div className="mb-4 space-y-3">
                    {/* Feedback Bubble */}
                    {sysFeedback && !draft && (
                        <div className={`p-4 rounded-2xl shadow-xl border animate-in fade-in zoom-in duration-200 ${sysFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            sysFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                'bg-white text-gray-800 border-gray-100'
                            }`}>
                            <div className="flex justify-between items-start gap-3">
                                <p className="text-sm font-medium">{sysFeedback.message}</p>
                                <button onClick={() => setSysFeedback(null)} className="opacity-50">✕</button>
                            </div>
                            {sysFeedback.suggestions && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {sysFeedback.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => setInput(s)} className="text-[10px] bg-black/5 px-2 py-1 rounded-lg hover:bg-black/10 transition font-medium">
                                            "{s}"
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Draft Card */}
                    {draft && (
                        <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 p-6 animate-in zoom-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Plan de Acción</h4>
                                <button onClick={() => setDraft(null)} className="text-gray-300 hover:text-gray-500 transition-colors">✕</button>
                            </div>

                            {draft.analysis && (
                                <div className="mb-6 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                                        {draft.analysis}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                {draft.actions?.map((action, i) => (
                                    <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-xs text-gray-700 flex flex-col gap-1">
                                        <span className="font-black text-indigo-500 uppercase tracking-wider text-[9px]">{action.tool}</span>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            {Object.entries(action.params).map(([key, val]) => (
                                                <div key={key}>
                                                    <span className="text-[9px] text-gray-400 block uppercase font-bold">{key}</span>
                                                    <span className="font-medium truncate block">{String(val)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={confirmDraft} disabled={isLoading} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                                {isLoading ? 'Ejecutando...' : 'Confirmar Todo'}
                            </button>
                        </div>
                    )}

                    {/* Manual Upload */}
                    {manualUploadMode && stagedFile && (
                        <div className="bg-white rounded-3xl shadow-2xl border border-amber-100 p-6 animate-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 text-center flex-1">Archivo Detectado</h4>
                                <button onClick={() => setStagedFile(null)} className="text-gray-300">✕</button>
                            </div>
                            <div className="space-y-4">
                                <input value={documentName} onChange={(e) => setDocumentName(e.target.value)} className="w-full text-sm rounded-2xl border-gray-100 bg-gray-50 py-3 px-4 focus:ring-amber-500" placeholder="Nombre..." />
                                <select value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full text-sm rounded-2xl border-gray-100 bg-gray-50 py-3 px-4 focus:ring-amber-500">
                                    <option value="">Seleccionar Entidad</option>
                                    {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                                <button onClick={handleManualUpload} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-500/20">Guardar en Bóveda</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* The Input Bar */}
                <form onSubmit={handleIngest} className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-2 flex items-center gap-1 group">
                    <button
                        type="button"
                        onClick={() => { setManualUploadMode(!manualUploadMode); setStagedFile(null); }}
                        className={`p-4 rounded-full transition-all ${manualUploadMode ? 'bg-amber-100 text-amber-600 scale-110' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>

                    <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="¿Qué quieres registrar?"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm font-medium py-3"
                        disabled={isLoading}
                    />

                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 text-gray-400 hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>

                    <button type="submit" disabled={isLoading || !input.trim()} className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 disabled:opacity-20 transition-all active:scale-95">
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
