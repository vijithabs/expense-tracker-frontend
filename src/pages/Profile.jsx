import React from "react";
import {
    User,
    Mail,
    Shield,
    LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    profileStyles as styles,
} from "../assets/dummyStyles";

const Profile = () => {
    const navigate = useNavigate();

    const user =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"));

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();

        navigate("/login");
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainContainer}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.avatar}>
                        <User className="w-12 h-12 text-white" />
                    </div>

                    <h1 className={styles.userName}>
                        {user?.name || "User"}
                    </h1>

                    <p className={styles.userEmail}>
                        {user?.email || "No Email"}
                    </p>
                </div>

               
                <div className={styles.content}>
                    <div className={styles.grid}>
                        {/* Profile Info */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <User className={styles.icon} />
                                Profile Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className={styles.label}>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        value={user?.name || ""}
                                        readOnly
                                        className={styles.input}
                                    />
                                </div>

                                <div>
                                    <label className={styles.label}>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        readOnly
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </div>

                       
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>
                                <Shield className={styles.icon} />
                                Security
                            </h2>

                            <div className="space-y-4">
                                <div className={styles.securityItem}>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-teal-500" />

                                        <div>
                                            <p className="font-medium text-gray-700">
                                                Email Verified
                                            </p>

                                            <p className={styles.securityText}>
                                                Your email is verified
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-green-500 font-semibold">
                                        Active
                                    </span>
                                </div>

                                <div className={styles.securityItem}>
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-teal-500" />

                                        <div>
                                            <p className="font-medium text-gray-700">
                                                Account Security
                                            </p>

                                            <p className={styles.securityText}>
                                                Your account is protected
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-green-500 font-semibold">
                                        Secure
                                    </span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className={`${styles.buttonPrimary} mt-4 flex items-center justify-center gap-2`}
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;