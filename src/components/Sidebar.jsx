import React, { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";

import {
    Home,
    ArrowUp,
    ArrowDown,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";

const MENU_ITEMS = [
    {
        text: "Dashboard",
        path: "/",
        icon: <Home size={20} />,
    },
    {
        text: "Income",
        path: "/income",
        icon: <ArrowUp size={20} />,
    },
    {
        text: "Expenses",
        path: "/expense",
        icon: <ArrowDown size={20} />,
    },
    {
        text: "Profile",
        path: "/profile",
        icon: <User size={20} />,
    },
];

const Sidebar = ({
    user,
    isCollapsed,
    setIsCollapsed,
}) => {
    const { pathname } = useLocation();

    const navigate = useNavigate();

    const sidebarRef = useRef(null);

    const [mobileOpen, setMobileOpen] =
        useState(false);

    const [activeHover, setActiveHover] =
        useState(null);

    const {
        name: username = "User",
        email = "user@mail.com",
    } = user || {};

    const initial = username
        .charAt(0)
        .toUpperCase();

    // Prevent scroll on mobile
    useEffect(() => {
        document.body.style.overflow =
            mobileOpen ? "hidden" : "auto";

        return () => {
            document.body.style.overflow =
                "auto";
        };
    }, [mobileOpen]);

    // Outside click close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                mobileOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(
                    e.target
                )
            ) {
                setMobileOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, [mobileOpen]);

    // Logout
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();

        navigate("/login");
    };

    // Collapse
    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    // Render Menu
    const renderMenuItem = ({
        text,
        path,
        icon,
    }) => {
        const isActive = pathname === path;

        return (
            <motion.li
                key={text}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Link
                    to={path}
                    onMouseEnter={() =>
                        setActiveHover(text)
                    }
                    onMouseLeave={() =>
                        setActiveHover(null)
                    }
                    className={`relative flex items-center gap-3 py-3 rounded-xl transition-all duration-300
                        
                        ${isActive
                            ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg"
                            : "text-gray-600 hover:bg-gray-100 hover:text-teal-600"
                        }

                        ${isCollapsed
                            ? "justify-center mx-2"
                            : "px-4"
                        }
                    `}
                >
                    <span>{icon}</span>

                    {!isCollapsed && (
                        <motion.span
                            initial={{
                                opacity: 0,
                                x: -10,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            className="font-medium"
                        >
                            {text}
                        </motion.span>
                    )}

                    {activeHover === text &&
                        !isActive &&
                        !isCollapsed && (
                            <span className="absolute right-4 w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                        )}
                </Link>
            </motion.li>
        );
    };

    return (
        <>
          
            <motion.div
                ref={sidebarRef}
                className="hidden lg:flex fixed top-16 bottom-0 z-30 flex-col"
                initial={{
                    x: -100,
                    opacity: 0,
                }}
                animate={{
                    x: 0,
                    opacity: 1,
                    width: isCollapsed
                        ? 85
                        : 260,
                }}
                transition={{
                    type: "spring",
                    damping: 25,
                }}
            >
                <div className="h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">

                   
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-12 z-20 w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:border-teal-400 hover:text-teal-600"
                    >
                        <motion.div
                            animate={{
                                rotate:
                                    isCollapsed
                                        ? 0
                                        : 180,
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                            >
                                <polyline
                                    points={
                                        isCollapsed
                                            ? "9 18 15 12 9 6"
                                            : "15 18 9 12 15 6"
                                    }
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </motion.div>
                    </button>

                    {/* User */}
                    <div
                        className={`border-b border-gray-100 pt-20 md:pt-6 pb-5
                        
                        ${isCollapsed
                                ? "px-3"
                                : "px-6"
                            }
                    `}
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                {initial}
                            </div>

                            {!isCollapsed && (
                                <motion.div className="ml-3 overflow-hidden">
                                    <h2 className="text-sm font-bold text-gray-800 truncate">
                                        {username}
                                    </h2>

                                    <p className="text-xs text-gray-500 truncate">
                                        {email}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="flex-1 overflow-auto py-4">
                        <ul className="space-y-2 px-2">
                            {MENU_ITEMS.map(
                                renderMenuItem
                            )}
                        </ul>
                    </div>

                    {/* Logout */}
                    <div
                        className={`border-t border-gray-100 p-4
                        
                        ${isCollapsed
                                ? "px-3"
                                : "px-6"
                            }
                    `}
                    >
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all w-full
                            
                            ${isCollapsed
                                    ? "justify-center"
                                    : "px-2"
                                }
                        `}
                        >
                            <LogOut size={20} />

                            {!isCollapsed && (
                                <span className="font-medium">
                                    Logout
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Mobile Button */}
            <motion.button
                onClick={() =>
                    setMobileOpen(
                        (prev) => !prev
                    )
                }
                className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-2xl flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
            >
                {mobileOpen ? (
                    <X size={24} />
                ) : (
                    <Menu size={24} />
                )}
            </motion.button>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div className="fixed inset-0 z-40 lg:hidden">

                        {/* Overlay */}
                        <motion.div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                            onClick={() =>
                                setMobileOpen(false)
                            }
                        />

                        {/* Sidebar */}
                        <motion.div
                            ref={sidebarRef}
                            className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl rounded-r-3xl overflow-hidden"
                            initial={{
                                x: "-100%",
                            }}
                            animate={{ x: 0 }}
                            exit={{
                                x: "-100%",
                            }}
                            transition={{
                                type: "spring",
                                damping: 25,
                            }}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                        {initial}
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-gray-800">
                                            {username}
                                        </h2>

                                        <p className="text-sm text-gray-500">
                                            {email}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() =>
                                        setMobileOpen(
                                            false
                                        )
                                    }
                                    className="text-gray-500 hover:text-red-500"
                                >
                                    <X />
                                </button>
                            </div>

                            {/* Menu */}
                            <ul className="p-4 space-y-2">
                                {MENU_ITEMS.map(
                                    ({
                                        text,
                                        path,
                                        icon,
                                    }) => (
                                        <Link
                                            key={
                                                text
                                            }
                                            to={
                                                path
                                            }
                                            onClick={() =>
                                                setMobileOpen(
                                                    false
                                                )
                                            }
                                            className={`flex items-center gap-3 p-4 rounded-xl transition-all
                                                
                                                ${pathname ===
                                                    path
                                                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                                                    : "text-gray-600 hover:bg-gray-100"
                                                }`}>

                                        
                                            {
                                                icon
                                            }

                                            <span className="font-medium">
                                                {
                                                    text
                                                }
                                            </span>
                                        </Link>
                                    )
                                )}
                            </ul>

                            {/* Logout */}
                            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
                                <button
                                    onClick={
                                        handleLogout
                                    }
                                    className="flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-xl p-3 w-full"
                                >
                                    <LogOut
                                        size={
                                            20
                                        }
                                    />

                                    <span className="font-medium">
                                        Logout
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;