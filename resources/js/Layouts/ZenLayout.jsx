import GlobalOmnibox from '@/Components/GlobalOmnibox';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ZenLayout({ children }) {
    const { url, props } = usePage();
    const pendingCount = props.pendingCount || 0;
    const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsNavigating(true));
        const removeFinish = router.on('finish', () => setIsNavigating(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    const navItems = [
        {
            name: 'Home',
            href: route('dashboard'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            active: url === '/dashboard' || url === '/'
        },
        {
            name: 'Omni',
            onClick: () => setIsOmniboxOpen(true),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            active: isOmniboxOpen
        },
        {
            name: 'Reportes',
            href: route('reports.index'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            active: url.startsWith('/reports')
        },
        {
            name: 'Categorías',
            href: route('categories.index'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            active: url.startsWith('/categories')
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-32">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 z-40">
                <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">CIVID</span>

                <div className="flex items-center gap-4">
                    {/* Inbox in Top Bar */}
                    {/* Inbox in Top Bar */}
                    <Link
                        href={route('inbox.index')}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(route('inbox.index'))}
                        onTouchStart={() => router.prefetch(route('inbox.index'))}
                        className={`relative p-2 rounded-full transition-colors ${url.startsWith('/inbox') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        {pendingCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                                {pendingCount}
                            </span>
                        )}
                    </Link>

                    {/* Bóveda (Vault) in Top Bar */}
                    <Link
                        href={route('documents.index')}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(route('documents.index'))}
                        onTouchStart={() => router.prefetch(route('documents.index'))}
                        className={`p-2 rounded-full transition-colors ${url.startsWith('/vault') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </Link>

                    {/* Profile Dropdown */}
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                                {props.auth.user.name[0]}
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content width="48">
                            <Dropdown.Link href={route('profile.edit')}>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Mi Perfil
                                </div>
                            </Dropdown.Link>
                            <Dropdown.Link href={route('profile.edit', { hash: 'update-password' })}>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Contraseña
                                </div>
                            </Dropdown.Link>
                            <hr className="my-1 border-gray-100" />
                            <Dropdown.Link href={route('logout')} method="post" as="button">
                                <span className="text-rose-600">Cerrar Sesión</span>
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>

            <main className="pt-20 px-6 max-w-lg mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={url}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Omnibox is triggered from Bottom Nav */}
            <GlobalOmnibox
                isOpen={isOmniboxOpen}
                onClose={() => setIsOmniboxOpen(false)}
            />

            {/* Bottom Navigation */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[420px] bg-white/90 backdrop-blur-lg border border-gray-100 px-2 py-2 rounded-full flex justify-between items-center z-50 shadow-xl shadow-indigo-900/5">
                {navItems.map((item) => (
                    item.href ? (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch={true}
                            onMouseEnter={() => router.prefetch(item.href)}
                            onTouchStart={() => router.prefetch(item.href)}
                            className={`flex flex-col items-center justify-center w-20 h-12 rounded-full transition-all duration-200 ${item.active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {item.icon}
                            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-widest">{item.name}</span>
                        </Link>
                    ) : (
                        <button
                            key={item.name}
                            onClick={item.onClick}
                            className={`flex flex-col items-center justify-center w-20 h-12 rounded-full transition-all duration-200 ${item.active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {item.icon}
                            <span className="text-[10px] mt-0.5 font-bold uppercase tracking-widest">{item.name}</span>
                        </button>
                    )
                ))}
            </nav>
        </div>
    );
}
