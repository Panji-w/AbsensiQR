"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Layout, Settings, User, Mail, Play, Pause } from "lucide-react";

const menuItems = [
    { id: 1, name: "Home", icon: <Home size={20} /> },
    { id: 2, name: "Projects", icon: <Layout size={20} /> },
    { id: 3, name: "Profile", icon: <User size={20} /> },
    { id: 4, name: "Messages", icon: <Mail size={20} /> },
    { id: 5, name: "Settings", icon: <Settings size={20} /> },
];

export default function Sidebar() {
    const [active, setActive] = useState(1);
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [hasHoveredOnce, setHasHoveredOnce] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = async () => {
        setIsHovered(true);

        if (!hasHoveredOnce && audioRef.current) {
            try {
                await audioRef.current.play();
                setIsPlaying(true);
                setHasHoveredOnce(true);
            } catch (err) {
                console.log("kanto, johto, hoenn, sinnoh, unova, kalos, alola, galar, hisui, paldea", err);
            }
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((err) => console.error(err));
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!mounted) return null;

    return (
        <motion.div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ width: 80 }}
            animate={{ width: isHovered ? 260 : 80 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed w-20 left-0 top-0 h-screen bg-blue-900 border-r rounded-r border-gray-200 flex flex-col z-50 shadow-xl overflow-hidden"
        >
            <audio ref={audioRef} src="/music/pkmn.mp3" loop />

            <div className="h-20 flex items-center px-6 flex-shrink-0">
                <div className="min-w-[32px] h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    N
                </div>
                <AnimatePresence>
                    {isHovered && (
                        <motion.span
                            // initial={{ opacity: 0, x: -10 }}
                            // animate={{ opacity: 1, x: 0 }}
                            // exit={{ opacity: 0, x: -10 }}
                            className="ml-4 font-bold text-xl tracking-tight whitespace-nowrap text-black"
                        >
                            NEXT.JS
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <nav className="flex-grow flex flex-col gap-1 px-3 mt-4">
                {menuItems.map((item) => {
                    const isActive = active === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            className="relative cursor-pointer group flex items-center px-3 py-3 transition-all"
                        >
                            {/* Active Box (kotak, tidak menutupi teks) */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBox"
                                    className="absolute left-2 top-1 bottom-1 w-[calc(100%-16px)] bg-gray-200"
                                />
                            )}

                            {/* Tip Hitam (kotak, di kiri) */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabTip"
                                    className="absolute left-0 top-1 bottom-1 w-2 bg-black rounded-l"
                                />
                            )}

                            {/* Konten menu */}
                            <div
                                className={`flex items-center transition-all duration-300 ${isActive ? "text-black" : "text-gray-400 group-hover:text-gray-600"
                                    }`}
                            >
                                <div className="min-w-[32px] flex justify-center z-10">{item.icon}</div>
                                {isHovered && (
                                    <motion.span
                                        // initial={{ opacity: 0 }}
                                        // animate={{ opacity: 1 }}
                                        // exit={{ opacity: 0 }}
                                        className={`ml-3 font-medium whitespace-nowrap z-10`}
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    );
                })}


            </nav>

            <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50 flex items-center">
                <div
                    onClick={togglePlay}
                    className={`flex items-center justify-center min-w-[40px] h-10 rounded-xl cursor-pointer transition-all duration-300 ${isPlaying ? "bg-black text-white" : "bg-gray-200 text-gray-500"
                        }`}
                >
                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </div>

                <AnimatePresence mode="wait">
                    {isHovered && (
                        <motion.div
                            key="music-info"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-3 flex-grow overflow-hidden"
                        >
                            <div className="flex justify-between items-center pr-2">
                                <p className="text-[10px] font-bold text-black uppercase tracking-widest">
                                    Now Playing
                                </p>
                                {isPlaying && (
                                    <div className="flex gap-0.5 items-end h-3">
                                        <motion.div
                                            animate={{ height: [2, 10, 4] }}
                                            transition={{ repeat: Infinity, duration: 0.6 }}
                                            className="w-0.5 bg-black"
                                        />
                                        <motion.div
                                            animate={{ height: [4, 2, 10] }}
                                            transition={{ repeat: Infinity, duration: 0.7 }}
                                            className="w-0.5 bg-black"
                                        />
                                        <motion.div
                                            animate={{ height: [10, 4, 2] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="w-0.5 bg-black"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="relative overflow-hidden h-4 mt-1">
                                <motion.div
                                    className="whitespace-nowrap text-xs font-medium text-gray-500"
                                    animate={{
                                        x: [-0, -200], // scroll dari 0 ke kiri -200px, bisa disesuaikan
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        duration: 8,
                                        ease: "linear",
                                    }}
                                >
                                    Littleroot Town - Pokémon Omega Ruby & Alpha Sapphire
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

        </motion.div>
    );
}
