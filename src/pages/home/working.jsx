import React, { useState, useEffect } from "react";
import {
    FiBatteryCharging,
    FiFeather,
    FiMapPin,
    FiZap,
    FiUser,
    FiLogOut,
    FiShoppingCart,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";

const EbikeHomePage = () => {
    const account = useSelector((store) => store.account);
    const dispatch = useDispatch();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

    const user = {
        name: "Alex Reid",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=2080",
    };

    useEffect(() => {
        const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
    };

    const styles = {
        container: {
            backgroundColor: '#111827',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minHeight: '100vh',
            overflowX: 'hidden'
        },
        header: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 3rem',
            zIndex: 50,
            transition: 'all 0.3s ease',
            backgroundColor: isHeaderScrolled ? 'rgba(17, 24, 39, 0.9)' : 'transparent',
            backdropFilter: isHeaderScrolled ? 'blur(10px)' : 'none',
            borderBottom: isHeaderScrolled ? '1px solid #374151' : '1px solid transparent'
        },
        logo: {
            fontSize: '2rem',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            cursor: 'pointer'
        },
        nav: {
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
        },
        navLink: {
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'color 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        authSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        },
        userInfo: {
            position: 'relative',
            cursor: 'pointer'
        },
        userAvatar: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
        },
        avatar: {
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            border: '2px solid #10B981',
            objectFit: 'cover'
        },
        dropdown: {
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '0.5rem',
            width: '12rem',
            backgroundColor: '#1F2937',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: '1px solid #374151',
            padding: '0.5rem 0'
        },
        dropdownItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'background-color 0.3s ease',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            width: '100%',
            textAlign: 'left'
        },
        authButton: {
            fontWeight: '600',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            border: '2px solid'
        },
        loginButton: {
            backgroundColor: 'transparent',
            borderColor: '#4B5563',
            color: '#D1D5DB'
        },
        registerButton: {
            backgroundColor: '#10B981',
            borderColor: '#10B981',
            color: '#ffffff'
        },
        heroSection: {
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '5rem'
        },
        heroBackground: {
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1620802051782-725fa33db067?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        },
        heroOverlay: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #111827, rgba(17, 24, 39, 0.7), transparent)'
        },
        heroContent: {
            position: 'relative',
            zIndex: 10,
            padding: '0 1rem'
        },
        heroTitle: {
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            fontWeight: 'bold',
            marginBottom: '1rem'
        },
        heroSubtitle: {
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            color: '#D1D5DB',
            maxWidth: '48rem',
            margin: '0 auto 2rem'
        },
        heroButtons: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center'
        },
        primaryButton: {
            backgroundColor: '#10B981',
            color: '#000000',
            fontWeight: '600',
            padding: '1rem 2.5rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            fontSize: '1.125rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: 'none',
            cursor: 'pointer'
        },
        secondaryButton: {
            backgroundColor: 'transparent',
            border: '2px solid #10B981',
            color: '#10B981',
            fontWeight: '600',
            padding: '1rem 2rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            fontSize: '1.125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        },
        mapButton: {
            backgroundColor: '#2563EB',
            color: '#ffffff',
            fontWeight: '600',
            padding: '1.25rem 3rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
            transform: 'scale(1)',
            border: 'none'
        },
        featuresSection: {
            padding: '5rem 1.5rem',
            maxWidth: '80rem',
            margin: '0 auto'
        },
        featuresTitle: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '4rem'
        },
        featuresGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2.5rem'
        },
        featureCard: {
            backgroundColor: '#1F2937',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            border: '1px solid #374151',
            transition: 'all 0.3s ease'
        },
        featureIcon: {
            display: 'inline-block',
            padding: '1rem',
            backgroundColor: '#111827',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            border: '1px solid #374151'
        },
        featureTitle: {
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
        },
        featureText: {
            color: '#9CA3AF',
            lineHeight: '1.6',
            marginBottom: '1rem'
        },
        footer: {
            backgroundColor: '#1F2937',
            padding: '3rem 1.5rem',
            textAlign: 'center'
        },
        footerLogo: {
            fontSize: '2rem',
            fontWeight: 'bold',
            letterSpacing: '0.2em',
            marginBottom: '1rem'
        },
        footerText: {
            color: '#9CA3AF'
        }
    };

    return (
        <div style={styles.container}>
            {/* --- HEADER --- */}
            <header style={styles.header}>
                <div style={styles.logo}>VOLT</div>

                <nav style={styles.nav}>
                    <a href="#models" style={styles.navLink}>Models</a>
                    <a href="#features" style={styles.navLink}>Features</a>
                    <Link to="/map" style={styles.navLink}>
                        <FiMapPin size={16} />
                        Find Stations
                    </Link>
                    <a href="#contact" style={styles.navLink}>Contact</a>
                </nav>

                {/* --- AUTH SECTION --- */}
                <div style={styles.authSection}>
                    {account ? (
                        <div
                            style={styles.userInfo}
                            onMouseEnter={() => setIsDropdownOpen(true)}
                            onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                            <div style={styles.userAvatar}>
                                <span style={{ fontWeight: '600' }}>
                                    {account.fullName || account.email}
                                </span>
                                <img
                                    src={user.avatar}
                                    alt="User Avatar"
                                    style={styles.avatar}
                                />
                            </div>

                            {isDropdownOpen && (
                                <div style={styles.dropdown}>
                                    <a href="#" style={styles.dropdownItem}>
                                        <FiUser /> My Profile
                                    </a>
                                    <a href="#" style={styles.dropdownItem}>
                                        <FiShoppingCart /> Order History
                                    </a>
                                    <div style={{ borderTop: '1px solid #374151', margin: '0.5rem 0' }}></div>
                                    <button onClick={handleLogout} style={{ ...styles.dropdownItem, color: '#F87171' }}>
                                        <FiLogOut /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={styles.authSection}>
                            <Link to="/login" style={{ ...styles.authButton, ...styles.loginButton }}>
                                Login
                            </Link>
                            <Link to="/register" style={{ ...styles.authButton, ...styles.registerButton }}>
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* --- Hero Section --- */}
            <section style={styles.heroSection}>
                <div style={styles.heroBackground}></div>
                <div style={styles.heroOverlay}></div>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>Ride the Future.</h1>
                    <p style={styles.heroSubtitle}>
                        Unleash unparalleled performance and iconic design. Welcome to the electric revolution.
                    </p>
                    <div style={{ ...styles.heroButtons, '@media (min-width: 640px)': { flexDirection: 'row' } }}>
                        <button style={styles.primaryButton}>
                            Discover Our Bikes
                        </button>
                        <Link to="/map" style={styles.mapButton}>
                            <FiMapPin size={20} />
                            Find Charging Stations
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section style={styles.featuresSection} id="features">
                <h2 style={styles.featuresTitle}>Why VOLT?</h2>
                <div style={styles.featuresGrid}>
                    {[
                        {
                            icon: FiBatteryCharging,
                            title: "Extended Range",
                            text: "Journey up to 70 miles on a single charge, pushing the boundaries of exploration.",
                        },
                        {
                            icon: FiFeather,
                            title: "Featherlight Frame",
                            text: "Crafted from aerospace-grade aluminum for an agile and responsive ride.",
                        },
                        {
                            icon: FiMapPin,
                            title: "Find Charging Stations",
                            text: "Discover nearby charging stations with our interactive map. Never worry about running out of power.",
                            isMapButton: true,
                        },
                        {
                            icon: FiZap,
                            title: "Instant Power",
                            text: "Experience exhilarating acceleration with our fine-tuned silent motor.",
                        },
                    ].map((feature, index) => (
                        <div key={index} style={styles.featureCard}>
                            <div style={styles.featureIcon}>
                                <feature.icon size={32} color="#10B981" />
                            </div>
                            <h3 style={styles.featureTitle}>{feature.title}</h3>
                            <p style={styles.featureText}>{feature.text}</p>
                            {feature.isMapButton && (
                                <Link to="/map" style={{
                                    ...styles.secondaryButton,
                                    backgroundColor: '#10B981',
                                    color: '#000000',
                                    borderColor: '#10B981'
                                }}>
                                    <FiMapPin size={16} />
                                    Open Map
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Footer --- */}
            <footer style={styles.footer}>
                <div style={styles.footerLogo}>VOLT</div>
                <p style={styles.footerText}>
                    Powering the future of urban mobility.
                </p>
            </footer>
        </div>
    );
};

export default EbikeHomePage;
