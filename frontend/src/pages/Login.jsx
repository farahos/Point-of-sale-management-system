import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useTheme } from "../hooks/useTheme";
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  User,
  Shield,
  LogIn,
  ChevronRight,
  Mail
} from "lucide-react";

const Login = () => {
    const [form, setForm] = useState({
        phone: "",
        password: ""
    });
    const { login, user } = useUser();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === "admin") navigate("/admin-dashboard");
        else if (user?.role === "user") navigate("/admin-dashboard");
    }, [user]);

    // Check for remembered phone
    useEffect(() => {
        const rememberedPhone = localStorage.getItem("rememberedPhone");
        if (rememberedPhone) {
            setForm(prev => ({ ...prev, phone: rememberedPhone }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.id]: event.target.value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        
        try {
            const { data } = await axios.post('/api/user/loginuser', form, { withCredentials: true });
            toast.success("Login successful!");
            
            // Remember phone if checkbox is checked
            if (rememberMe) {
                localStorage.setItem("rememberedPhone", form.phone);
            } else {
                localStorage.removeItem("rememberedPhone");
            }
            
            setLoading(false);
            login(data, data.expirein);
            
            if (data.role === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/");
            }
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || "Login failed. Please try again.");
            console.error(error);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Theme-based styling
    const containerClasses = theme === 'dark' 
        ? "bg-gradient-to-br from-gray-900 to-gray-800" 
        : "bg-gradient-to-br from-green-50 to-gray-50";

    const cardClasses = theme === 'dark'
        ? "bg-gray-800/90 backdrop-blur-lg border-gray-700 text-gray-100"
        : "bg-white/90 backdrop-blur-lg border-green-100 text-gray-900";

    const inputClasses = theme === 'dark'
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-green-500 focus:border-green-500";

    const buttonClasses = theme === 'dark'
        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white";

    const linkClasses = theme === 'dark'
        ? "text-green-400 hover:text-green-300"
        : "text-green-600 hover:text-green-500";

    const labelClasses = theme === 'dark'
        ? "text-gray-300"
        : "text-gray-700";

    const checkboxClasses = theme === 'dark'
        ? "bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
        : "bg-gray-100 border-gray-300 text-green-600 focus:ring-green-500";

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${containerClasses}`}>
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden">
                {theme === 'dark' ? (
                    <>
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute top-40 left-40 w-80 h-80 bg-lime-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </>
                ) : (
                    <>
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute top-40 left-40 w-80 h-80 bg-lime-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </>
                )}
            </div>

            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Main Card */}
                <div className={`rounded-3xl shadow-2xl border p-8 ${cardClasses}`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                theme === 'dark' 
                                    ? 'bg-gradient-to-br from-green-600 to-emerald-700' 
                                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                            }`}>
                                <Shield size={32} className="text-white" />
                            </div>
                        </div>
                        <h1 className={`text-3xl font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-green-700'
                        }`}>
                            Gal Hadda
                        </h1>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ku soo gal akoonkaaga si aad u sii waddo
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Field */}
                        <div>
                            <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${labelClasses}`}>
                                Telefoon
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                                </div>
                                <input
                                    type="text"
                                    id="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${inputClasses}`}
                                    placeholder="Gali telefoonkaaga"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${labelClasses}`}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={20} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={`block w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 ${inputClasses}`}
                                    placeholder="Gali password kaaga"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200 ${
                                        theme === 'dark' ? 'text-gray-400 hover:text-green-400' : 'text-gray-400 hover:text-green-600'
                                    }`}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className={`w-4 h-4 rounded focus:ring-2 focus:ring-offset-0 ${checkboxClasses}`}
                                />
                                <span className={`ml-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    I xasuuso
                                </span>
                            </label>
                            {/* <Link
                                to="/forgot-password"
                                className={`text-sm transition-colors duration-200 ${linkClasses}`}
                            >
                                Halmaasay passwordka?
                            </Link> */}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2 ${buttonClasses}`}
                        >
                            {loading ? (
                                <>
                                    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                                        theme === 'dark' ? 'border-white' : 'border-white'
                                    }`}></div>
                                    wax yar sug...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Gal Hadda
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                   

                    {/* Register Link */}
                    
                </div>

                {/* Additional Info */}
                <div className={`mt-6 text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    <p>By logging in, you agree to our Terms of Service and Privacy Policy</p>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out;
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;