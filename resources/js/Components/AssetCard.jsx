import React from 'react';
import { Link } from '@inertiajs/react';

export default function AssetCard({ asset }) {
    const imageUrl = asset.metadata?.image_url;

    return (
        <Link
            href={route('entities.show', asset.id)}
            className="block w-full max-w-sm mx-auto mb-8 group"
        >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
                {/* Hero section */}
                <div className="relative bg-white h-48 flex items-center justify-center p-6 border-b border-gray-50 dark:bg-gray-900 dark:border-gray-800">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={asset.name}
                            className="max-h-full max-w-full object-contain transform transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-90" />
                    )}

                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                        <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            {asset.category}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                            {asset.status}
                        </span>
                    </div>
                </div>

                {/* Content section */}
                <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 transition-colors">
                        {asset.name}
                    </h3>

                    <div className="space-y-3">
                        {asset.metadata && Object.entries(asset.metadata)
                            .filter(([key]) => !['image_url', 'color'].includes(key))
                            .slice(0, 3)
                            .map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 capitalize font-medium">{key.replace('_', ' ')}</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[150px]">
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                    </span>
                                </div>
                            ))
                        }
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-center">
                        <span className="text-indigo-600 text-sm font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            Gestionar Activo
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
