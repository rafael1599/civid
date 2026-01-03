import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Integrations({ googleConnected, googleEmail, lastScanAt }) {
    const handleConnect = () => {
        router.get(route('auth.google'));
    };

    const handleDisconnect = () => {
        if (confirm('¿Desconectar Google? Dejarás de recibir sugerencias automáticas.')) {
            router.delete(route('settings.integrations.disconnect-google'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Integraciones
                </h2>
            }
        >
            <Head title="Integraciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-bold mb-4">Google Workspace</h3>

                            {googleConnected ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="font-semibold text-green-900">Conectado</p>
                                            <p className="text-sm text-green-700">{googleEmail}</p>
                                            {lastScanAt && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Último escaneo: {new Date(lastScanAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleDisconnect}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
                                        >
                                            Desconectar
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-600">
                                        <p className="font-semibold mb-2">Permisos activos:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Gmail (solo lectura) - Detectar recibos automáticamente</li>
                                            <li>Calendar (solo lectura) - Detectar pagos programados</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                                        <p className="text-gray-600 mb-4">
                                            Conecta tu cuenta de Google para que CIVID escanee automáticamente:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4 ml-2">
                                            <li>Facturas y recibos en Gmail</li>
                                            <li>Eventos de pago en Google Calendar</li>
                                        </ul>
                                        <button
                                            onClick={handleConnect}
                                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                        >
                                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                            </svg>
                                            Conectar con Google
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
