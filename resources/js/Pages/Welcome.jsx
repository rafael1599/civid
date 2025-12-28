import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }) {
    return (
        <div className="bg-[#050505] min-h-screen text-gray-300 selection:bg-indigo-500/30 font-sans selection:text-indigo-200">
            <Head title="CIVID | Tu Vida, Bajo Control Autónomo" />

            {/* Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0">
                <div className="flex items-center gap-2 group cursor-default">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl">C</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white">CIVID</span>
                </div>

                <nav className="flex items-center gap-8">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="text-sm font-bold text-white hover:text-indigo-400 transition-colors"
                        >
                            Ir al Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={route('login')}
                                className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href={route('register')}
                                className="px-6 py-3 bg-white text-black text-sm font-black rounded-full hover:bg-indigo-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                            >
                                Empezar Ahora
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Inteligencia Autónoma v1.0</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8">
                            Tu vida, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">bajo control.</span>
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed max-w-lg mb-12 font-medium">
                            CIVID es el primer ERP Personal Autónomo. Una IA que entiende tus activos, tus seguros, tu salud y tus finanzas sin necesidad de formularios eternos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href={route('register')} className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all text-center shadow-2xl shadow-indigo-600/30">
                                Crear Cuenta Gratis
                            </Link>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-center backdrop-blur-sm">
                                Ver Demo Interactiva
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 blur-[100px] group-hover:blur-[120px] transition-all opacity-50"></div>
                        <div className="relative bg-zinc-900/50 rounded-[3rem] p-4 border border-white/10 backdrop-blur-3xl shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-700">
                            <img
                                src="/civid_hero_mockup_1766896756167.png"
                                alt="CIVID Interface Mockup"
                                className="rounded-[2.5rem] shadow-inner"
                            />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-white/5 border-y border-white/5 pb-24 pt-24 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">Omnibox Inteligente</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">
                                    Olvida los formularios. Escribe "compré seguro para el coche" y CIVID se encargará de mapear el activo, el costo y la fecha automáticamente.
                                </p>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 hover:border-emerald-500/30 transition-all group">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">Radar de Liquidez</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">
                                    Visualiza tus próximos 30 días de compromisos financieros con un radar dinámico que te avisa antes de que el saldo sea crítico.
                                </p>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 hover:border-indigo-500/30 transition-all group">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 tracking-tight uppercase">Control de Activos</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">
                                    Registra tus propiedades físicos y financieros. CIVID crea un grafo de dependencias para que sepas qué seguro protege a qué vehículo.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-white/5 text-center mt-24">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-6 h-6 bg-white text-black rounded-lg flex items-center justify-center font-black text-xs">C</div>
                        <span className="text-sm font-black tracking-tighter text-white">CIVID v1.0</span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
                        Desarrollado para el futuro de la gestión de vida personal.
                    </p>
                </div>
            </footer>
        </div>
    );
}
