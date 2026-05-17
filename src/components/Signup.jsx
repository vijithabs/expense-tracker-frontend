import React, { useState } from 'react';
import { signupStyles } from '../assets/dummyStyles';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = ({ API_URL = "https://expense-tracker-backend-c1iz.onrender.com", onSignup }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const fetchProfile = async (token) => {
        if (!token) return null;

        const res = await axios.get(`${API_URL}/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return res.data;
    };

    const persistAuth = (profile, token) => {
        try {
            if (token) localStorage.setItem("token", token);
            if (profile) localStorage.setItem("user", JSON.stringify(profile));
        } catch (err) {
            console.log(err);
        }
    };

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Name is required";

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const res = await axios.post(
                `${API_URL}/user/register`,
                { name, email, password },
                { headers: { "Content-Type": "application/json" } }
            );

            const data = res.data || {};
            const token = data.token ?? null;
            const profile = data.user ?? null;

            if (token && profile) {

                persistAuth(profile, token);

                if (typeof onSignup === "function") {
                    onSignup(profile, token);
                }

                navigate("/");
            } else {

                navigate("/login");
            }

        } catch (err) {
            console.log("ERROR:", err);
            console.log("RESPONSE:", err.response);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ api: err.response.data.message });
            } else {
                setErrors({ api: err.message || "Signup failed" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={signupStyles.pageContainer}>
            <div className={signupStyles.cardContainer}>

                {/*Header*/}
                <div className={signupStyles.header}>
                    <button
                        className={signupStyles.backButton}
                        onClick={() => navigate("/login")}
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className={signupStyles.avatar}>
                        <User className="w-10 h-10 text-white" />
                    </div>

                    <h1 className={signupStyles.headerTitle}>
                        Create Account
                    </h1>

                    <p className={signupStyles.headerSubtitle}>
                        Sign up to get started
                    </p>
                </div>

                {/*Form*/}
                <form
                    onSubmit={handleSubmit}
                    className={`${signupStyles.formContainer} space-y-5`}
                >

                    {/* API Error */}
                    {errors.api && (
                        <p className={signupStyles.apiError}>{errors.api}</p>
                    )}

                    {/*Name*/}
                    <div>
                        <div className={signupStyles.inputContainer}>
                            <span className={signupStyles.inputIcon}>
                                <User size={18} />
                            </span>
                            <input
                                type="text"
                                required
                                placeholder="Full Name"
                                className={signupStyles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        {errors.name && (
                            <p className={signupStyles.fieldError}>{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <div className={signupStyles.inputContainer}>
                            <span className={signupStyles.inputIcon}>
                                <Mail size={18} />
                            </span>
                            <input
                                type="email"
                                required
                                placeholder="Email"
                                className={signupStyles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {errors.email && (
                            <p className={signupStyles.fieldError}>{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div className={signupStyles.inputContainer}>
                            <span className={signupStyles.inputIcon}>
                                <Lock size={18} />
                            </span>

                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Password"
                                className={signupStyles.passwordInput}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {/* Toggle */}
                            <button
                                type="button"
                                aria-label="Toggle password visibility"
                                className={signupStyles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {/* {showPassword ? <EyeOff size={18} /> : <Eye size={18} />} */}
                            </button>
                        </div>
                        {errors.password && (
                            <p className={signupStyles.fieldError}>{errors.password}</p>
                        )}
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`${signupStyles.button} ${isLoading ? signupStyles.buttonDisabled : ""}`}
                    >
                        {isLoading && <span className={signupStyles.spinner}></span>}
                        {isLoading ? "Creating..." : "Sign Up"}
                    </button>

                    {/* Footer */}
                    <div className={signupStyles.signInContainer}>
                        <p className={signupStyles.signInText}>
                            Already have an account?{" "}
                            <Link to="/login" className={signupStyles.signInLink}>
                                Sign in
                            </Link>
                        </p>
                    </div>

                </form>
            </div >
        </div >
    );
};

export default Signup;