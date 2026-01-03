import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Checkbox from '@/Components/Checkbox';
import Modal from '@/Components/Modal';

// Basic Countdown Component
const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    React.useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const currentHour = now.getHours();
            // Next 6-hour interval: 0, 6, 12, 18, 24
            const nextInterval = Math.ceil((currentHour + 1) / 6) * 6;
            const nextScan = new Date(now);
            nextScan.setHours(nextInterval, 0, 0, 0);
            if (nextScan <= now) nextScan.setDate(nextScan.getDate() + 1);

            const diff = nextScan - now;
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, []);

    return <span className="font-mono font-bold text-blue-600">{timeLeft}</span>;
};

export default function PendingInbox({ pendingItems, entities, auth }) {
    const { flash } = usePage().props;
    // ... existing hooks ...
    const [processingId, setProcessingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [modifiedItems, setModifiedItems] = useState({});
    const [diffItem, setDiffItem] = useState(null);

    const handleConfirm = (id) => {
        setProcessingId(id);
        const item = pendingItems.find(i => i.id === id);
        const modified = modifiedItems[id];
        const finalData = modified ? {
            ...item.extracted_data,
            actions: item.extracted_data.actions.map(action => {
                if (modified.entity_id) {
                    return {
                        ...action,
                        params: {
                            ...action.params,
                            entity_id: modified.entity_id,
                            entity_name: modified.entity_name
                        }
                    };
                }
                return action;
            })
        } : item.extracted_data;

        router.post(route('inbox.confirm', id), { data: finalData }, {
            onFinish: () => setProcessingId(null),
            onError: (errors) => console.error('Confirm Error:', errors)
        });
    };

    const handleDiscard = (id) => {
        if (!confirm('¿Estás seguro de descartar esta sugerencia?')) return;
        setProcessingId(id);
        router.delete(route('inbox.destroy', id), {
            onFinish: () => setProcessingId(null),
            onError: (errors) => console.error('Discard Error:', errors)
        });
    };

    const handleScan = () => {
        setIsScanning(true);
        router.post(route('inbox.scan'), {}, {
            onFinish: () => setIsScanning(false),
            onError: (errors) => console.error('Scan Error:', errors)
        });
    };

    // ... toggleSelection, toggleAll ...

    const handleBulkConfirm = () => {
        if (!confirm(`¿Confirmar ${selectedIds.length} elementos?`)) return;
        setProcessingId('bulk');
        router.post(route('inbox.bulk-confirm'), { ids: selectedIds }, {
            onFinish: () => {
                setProcessingId(null);
                setSelectedIds([]);
            },
            onError: (errors) => console.error('Bulk Confirm Error:', errors)
        });
    };

    const handleBulkDiscard = () => {
        if (!confirm(`¿Descartar ${selectedIds.length} elementos?`)) return;
        setProcessingId('bulk');
        router.post(route('inbox.bulk-destroy'), { ids: selectedIds }, {
            onFinish: () => {
                setProcessingId(null);
                setSelectedIds([]);
            },
            onError: (errors) => console.error('Bulk Discard Error:', errors)
        });
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Bandeja de Confirmación ({pendingItems.length})
                    </h2>
                    <PrimaryButton
                        onClick={handleScan}
                        disabled={isScanning}
                        className={isScanning ? 'opacity-75 cursor-wait' : ''}
                    >
                        {isScanning ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Escaneando...
                            </>
                        ) : 'Escanear Ahora'}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Por Confirmar" />

            {/* Diff Modal */}
            <Modal show={!!diffItem} onClose={() => setDiffItem(null)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Detalle de Extracción (Diff View)</h2>
                    {diffItem && (
                        <div className="grid grid-cols-2 gap-4 h-96 overflow-y-auto font-mono text-xs">
                            <div className="bg-gray-100 p-3 rounded">
                                <h3 className="font-bold text-gray-500 mb-2 uppercase">Raw Data (Source)</h3>
                                <pre className="whitespace-pre-wrap break-words text-gray-600">
                                    {JSON.stringify(diffItem.raw_data, null, 2)}
                                </pre>
                            </div>
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                <h3 className="font-bold text-blue-500 mb-2 uppercase">Extracted (AI)</h3>
                                <pre className="whitespace-pre-wrap break-words text-blue-800">
                                    {JSON.stringify(diffItem.extracted_data, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setDiffItem(null)}>
                            Cerrar
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 inset-x-0 pb-6 pointer-events-none z-50">
                    <div className="max-w-xl mx-auto px-4 pointer-events-auto">
                        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 flex items-center justify-between">
                            <span className="font-medium px-2">{selectedIds.length} seleccionados</span>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBulkDiscard}
                                    disabled={processingId === 'bulk'}
                                    className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 rounded transition"
                                >
                                    Descartar
                                </button>
                                <button
                                    onClick={handleBulkConfirm}
                                    disabled={processingId === 'bulk'}
                                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded transition font-bold"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {flash.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {flash.error}
                        </div>
                    )}

                    {pendingItems.length === 0 ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-12 text-center text-gray-500">
                            <div className="rounded-full bg-blue-50 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">¡Todo al día!</h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                No tienes sugerencias pendientes. Tu asistente financiero está monitoreando en segundo plano.
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 inline-block border border-gray-100">
                                <p className="text-sm text-gray-600">
                                    Siguiente escaneo automático en: <CountdownTimer />
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                O puedes iniciar un escaneo manual cuando quieras.
                            </p>
                        </div>
                    ) : (
                        <div className="mb-4 flex items-center gap-2 px-1">
                            <Checkbox
                                checked={selectedIds.length === pendingItems.length && pendingItems.length > 0}
                                onChange={toggleAll}
                            />
                            <span className="text-sm text-gray-600">Seleccionar todos</span>
                        </div>
                    )}

                    {pendingItems.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingItems.map((item) => {
                                // Extract key data for display
                                const action = item.extracted_data.actions?.[0]; // Assuming single action for now
                                const params = action?.params || {};
                                const amount = params.value || params.amount || 0;
                                const title = params.description || item.raw_data.subject || item.raw_data.summary;
                                const isSelected = selectedIds.includes(item.id);

                                // Local modified state
                                const modified = modifiedItems[item.id] || {};
                                const currentEntityId = modified.entity_id || params.entity_id || '';

                                return (
                                    <div key={item.id} className={`bg-white overflow-hidden shadow-sm sm:rounded-lg border transition-all flex flex-col relative ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                        <div className="absolute top-3 left-3 z-10">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => toggleSelection(item.id)}
                                            />
                                        </div>

                                        <div className={`h-2 w-full ${item.confidence_score > 80 ? 'bg-green-500' : (item.confidence_score > 50 ? 'bg-yellow-500' : 'bg-red-500')}`} />

                                        <div className="p-6 flex-1 pt-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${item.source_type === 'gmail' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {item.source_type.toUpperCase()}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => setDiffItem(item)}
                                                        className="text-xs text-gray-400 hover:text-blue-500"
                                                        title="Ver original vs extraído"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 truncate" title={title}>
                                                {title}
                                            </h3>

                                            <div className="text-3xl font-bold text-gray-800 mb-4">
                                                {formatCurrency(amount)}
                                            </div>

                                            {item.requires_manual_review && (
                                                <div className="bg-red-50 text-red-700 text-xs p-2 rounded mb-4 border border-red-100">
                                                    ⚠️ <strong>Revisión requerida:</strong> {item.review_reason}
                                                </div>
                                            )}

                                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                                {params.date && (
                                                    <div className="flex justify-between">
                                                        <span>Fecha:</span>
                                                        <span className="font-medium">{params.date}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center">
                                                    <span>Entidad:</span>
                                                    <select
                                                        value={currentEntityId}
                                                        onChange={(e) => handleEntityChange(item.id, e.target.value)}
                                                        className="text-xs py-1 px-2 border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 max-w-[150px]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {entities.map(entity => (
                                                            <option key={entity.id} value={entity.id}>
                                                                {entity.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span>Confianza:</span>
                                                    <span className={`font-medium ${item.confidence_score < 70 ? 'text-orange-500' : 'text-green-600'}`}>
                                                        {item.confidence_score}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 px-6 py-4 flex justify-between gap-3">
                                            <SecondaryButton
                                                onClick={() => handleDiscard(item.id)}
                                                disabled={processingId === item.id}
                                                className="w-full justify-center !text-red-600 hover:!bg-red-50"
                                            >
                                                Descartar
                                            </SecondaryButton>
                                            <PrimaryButton
                                                onClick={() => handleConfirm(item.id)}
                                                disabled={processingId === item.id}
                                                className="w-full justify-center"
                                            >
                                                {/* Visual indicator if modified */}
                                                {processingId === item.id ? '...' : (modifiedItems[item.id] ? 'Guardar' : 'Confirmar')}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
