import React, { useState, useRef, useEffect } from 'react'
import logo from "../assets/logo.png";
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User, LogOut } from "lucide-react";
import axios from "axios"

const BASE_URL = "https://expense-tracker-backend-c1iz.onrender.com";

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);

    const [user, setUser] = useState(propUser || {
        name: "",
        email: ""
    });

    // Fetch user
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setUser(response.data.user || response.data);

            } catch (error) {
                console.error(error);
            }
        };

        if (!propUser) {
            fetchUserData();
        }
    }, [propUser]);

    // Toggle menu
    const toggleMenu = () => setMenuOpen(prev => !prev);


    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 md:px-8 max-w-7xl mx-auto">

                {/*  Logo */}
                <div
                    onClick={() => navigate("/")}
                    className="flex items-center cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                        <img src={logo} alt="logo" />
                    </div>
                    <span className="text-2xl md:text-3xl text-gray-900 font-semibold ml-2">
                        Expense Tracker
                    </span>
                </div>

                {/* User */}
                {user && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={toggleMenu}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                        >

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 text-white font-bold">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>

                            {/* Text */}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-800">
                                    {user?.name || "User"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.email || "user@gmail.com"}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {/*  Dropdown */}
                        {menuOpen && (
                            <div className="absolute top-14 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50">

                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-800">
                                                {user?.name || "User"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user?.email || "user@gmail.com"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile */}
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            navigate("/profile");
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2 rounded-lg"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>
                                </div>

                                {/* Logout */}
                                <div className="p-2 border-t">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log out
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                )}

            </div>
        </header>
    );
};

export default Navbar;