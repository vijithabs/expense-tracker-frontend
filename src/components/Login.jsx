import React, { useState } from 'react';
import { loginStyles } from '../assets/dummyStyles';
import { User, Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin, API_URL = "http://localhost:5000" }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    //  Fetch profile
    const fetchProfile = async (token) => {
        if (!token) return null;

        const res = await axios.get(`${API_URL}/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.data;
    };

    //  Save auth
    const persistAuth = (profile, token) => {
        const storage = rememberMe ? localStorage : sessionStorage;

        try {
            if (token) storage.setItem("token", token);
            if (profile) storage.setItem("user", JSON.stringify(profile));
        } catch (err) {
            console.log(err);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await axios.post(
                `${API_URL}/user/login`,
                { email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            const data = res.data;
            console.log(data);

            const token = data.token;
            const profile = data.user;

            if (!token || !profile) {
                throw new Error("Invalid login response");
            }

            persistAuth(profile, token);

            if (onLogin) onLogin(profile, token);

            navigate("/dashboard");

        } catch (err) {
            console.log(err);
            setError(
                err.response?.data?.message || "Login failed. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={loginStyles.pageContainer}>
            <div className={loginStyles.cardContainer}>

                {/* Header */}
                <div className={loginStyles.header}>
                    <div className={loginStyles.avatar}>
                        <User className="w-10 h-10 text-white" />
                    </div>

                    <h1 className={loginStyles.headerTitle}>
                        Welcome Back
                    </h1>

                    <p className={loginStyles.headerSubtitle}>
                        Sign in to your ExpenseTracker account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={`${loginStyles.formContainer} space-y-5`}>

                    {/* Error */}
                    {error && (
                        <div className={loginStyles.errorContainer}>
                            <div className={loginStyles.errorIcon}>!</div>
                            <p className={loginStyles.errorText}>{error}</p>
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <div className={loginStyles.inputContainer}>
                            <span className={loginStyles.inputIcon}>
                                <User size={18} />
                            </span>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className={loginStyles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className={loginStyles.inputContainer}>
                            <span className={loginStyles.inputIcon}>
                                <Lock size={18} />
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className={loginStyles.passwordInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {/* Eye Toggle */}
                            <button
                                type="button"
                                className={loginStyles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {/* {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )} */}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className={loginStyles.checkboxContainer}>
                        <input
                            type="checkbox"
                            className={loginStyles.checkbox}
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                        />
                        <label className={loginStyles.checkboxLabel}>
                            Remember me
                        </label>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`${loginStyles.button} ${isLoading ? loginStyles.buttonDisabled : ""}`}
                    >
                        {isLoading && <span className={loginStyles.spinner}></span>}
                        {isLoading ? "Signing in..." : "Login"}
                    </button>

                    {/* Footer */}
                    <div className={loginStyles.signUpContainer}>
                        <p className={loginStyles.signUpText}>
                            Don't have an account?{" "}
                            <span
                                className={loginStyles.signUpLink}
                                onClick={() => navigate("/signup")}
                            >
                                Sign up
                            </span>
                        </p>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Login;