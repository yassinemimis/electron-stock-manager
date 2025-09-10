import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // تحديث الوقت كل ثانية
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // تحميل البيانات المحفوظة عند التحميل
    useEffect(() => {
        const savedUsername = localStorage.getItem('remembered_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));

        // التحقق من البيانات
        if (username === "admin" && password === "1234") {
            // حفظ اسم المستخدم إذا كان "تذكرني" مفعل
            if (rememberMe) {
                localStorage.setItem('remembered_username', username);
            } else {
                localStorage.removeItem('remembered_username');
            }

            // حفظ وقت آخر دخول
            localStorage.setItem('last_login', new Date().toISOString());

            onLogin();
        } else {
            setError("اسم المستخدم أو كلمة المرور غير صحيحة!");
            // هز الحقول عند الخطأ
            const form = document.querySelector('.login-form');
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 600);
        }

        setIsLoading(false);
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "صباح الخير";
        if (hour < 17) return "نهارك سعيد";
        return "مساء الخير";
    };

    return (
        <div className="login-container d-flex justify-content-center align-items-center min-vh-100 bg-white position-relative"
            style={{

                overflow: 'hidden'
            }}>


            {/* بطاقة تسجيل الدخول */}
            <div className="card shadow-lg border-0 login-form bg-dark text-white"
                style={{
                    width: "400px",
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    zIndex: 2
                }}>

                {/* رأس البطاقة */}
                <div className="card-header bg-bg-dark border-0 text-center pt-4">
                    <div className="login-logo mb-3">
                        <div
                            className="logo-circle mx-auto d-flex align-items-center justify-content-center"
                            style={{
                                width: '200px',
                                height: '150px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                overflow: 'hidden', // مهم حتى لا تطلع أجزاء من الصورة خارج الدائرة
                            }}
                        >
                            <img
                                src="/logo.png" // ضع مسار الصورة هنا
                                alt="Logo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>


                    </div>
                    <h3 className="text-white fw-bold mb-1">إدارة المخزون</h3>
                    <p className="text-white mb-0">{getGreeting()}! مرحباً بعودتك</p>
                    <small className="text-white">
                        {currentTime.toLocaleDateString('ar-DZ', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </small>
                </div>

                {/* محتوى البطاقة */}
                <div className="card-body px-4 pb-4">
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* حقل اسم المستخدم */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold text-white">
                                <i className="fas fa-user me-2 "></i>
                                اسم المستخدم
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="أدخل اسم المستخدم"
                                    required
                                    disabled={isLoading}
                                    style={{
                                        border: '2px solid #e9ecef',
                                        borderRadius: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                />
                            </div>
                        </div>

                        {/* حقل كلمة المرور */}
                        <div className="mb-3">
                            <label className="form-label fw-semibold text-white">
                                <i className="fas fa-lock me-2"></i>
                                كلمة المرور
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control form-control-lg"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="أدخل كلمة المرور"
                                    required
                                    disabled={isLoading}
                                    style={{
                                        border: '2px solid #e9ecef',
                                        borderRadius: '10px 0 0 10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ borderRadius: '0 10px 10px 0' }}
                                    disabled={isLoading}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* تذكرني */}
                        <div className="mb-4 d-flex justify-content-between align-items-center">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    disabled={isLoading}
                                />
                                <label className="form-check-label text-white" htmlFor="rememberMe">
                                    تذكرني
                                </label>
                            </div>
                            <a href="#" className="text-decoration-none small" style={{ color: '#667eea' }}>
                                نسيت كلمة المرور؟
                            </a>
                        </div>

                        {/* زر تسجيل الدخول */}
                        <button
                            type="submit"
                            className="btn btn-lg w-100 fw-bold"
                            disabled={isLoading}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                transform: isLoading ? 'scale(0.98)' : 'scale(1)'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    جارٍ التحقق...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt me-2"></i>
                                    تسجيل الدخول
                                </>
                            )}
                        </button>
                    </form>


                </div>
            </div>



        </div>
    );
};

export default Login;