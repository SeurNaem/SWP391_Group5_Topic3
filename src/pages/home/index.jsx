import React, { useState, useEffect } from "react";
import {
  FiBatteryCharging,
  FiMapPin,
  FiZap,
  FiUser,
  FiLogOut,
  FiShoppingCart,
  FiTarget,
  FiSearch,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/accountSlice";
import { themeColors } from "../../utils/theme";
import evImage from "../../assets/ev.png";
import blankAvatar from "../../assets/blank.png";

const EbikeHomePage = () => {
  const account = useSelector((store) => store.account);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  const user = {
    name: "user",
    avatar: blankAvatar,
  };

  // Function to handle navigation with authentication check
  const handleAuthenticatedNavigation = (path) => {
    if (!account) {
      // If user is not logged in, redirect to login page
      navigate('/login');
    } else {
      // If user is logged in, navigate to the intended path
      navigate(path);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if clicking outside of it
      if (isDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Toggle dropdown when avatar is clicked
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
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
      gap: '0.75rem',
      cursor: 'pointer'
    },
    avatar: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      border: `2px solid ${themeColors.primary}`,
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
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
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
      backgroundImage: `url(${evImage})`,
      backgroundSize: '120% auto',
      backgroundPosition: 'left center',
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
      backgroundColor: themeColors.primary,
      color: '#ffffff',
      fontWeight: '600',
      padding: '1rem 2.5rem',
      borderRadius: '9999px',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      fontSize: '1.125rem',
      boxShadow: '0 4px 12px rgba(77, 160, 214, 0.2)',
      border: 'none',
      cursor: 'pointer'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      border: `2px solid ${themeColors.primary}`,
      color: themeColors.primary,
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
      backgroundColor: themeColors.primary,
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
      boxShadow: '0 4px 12px rgba(77, 160, 214, 0.2)',
      transform: 'scale(1)',
      border: 'none'
    },
    modelsSection: {
      padding: '5rem 1.5rem',
      maxWidth: '80rem',
      margin: '0 auto',
      backgroundColor: '#0F172A'
    },
    modelsTitle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '1rem',
      color: '#ffffff'
    },
    modelsSubtitle: {
      fontSize: '1.125rem',
      textAlign: 'center',
      color: '#9CA3AF',
      marginBottom: '3rem'
    },
    modelsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem'
    },
    modelCard: {
      backgroundColor: '#1F2937',
      borderRadius: '1rem',
      overflow: 'hidden',
      border: '1px solid #374151',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    modelImageWrapper: {
      width: '100%',
      height: '200px',
      overflow: 'hidden',
      backgroundColor: '#111827'
    },
    modelImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    modelContent: {
      padding: '1.5rem'
    },
    modelBrand: {
      fontSize: '1rem',
      fontWeight: '600',
      color: themeColors.primary,
      marginBottom: '0.25rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    modelName: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '1rem'
    },
    connectorBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: '#111827',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      color: '#9CA3AF',
      border: '1px solid #374151'
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
    },
    contactSection: {
      padding: '4rem 1.5rem',
      backgroundColor: '#111827',
      borderTop: '1px solid #374151'
    },
    contactContainer: {
      maxWidth: '80rem',
      margin: '0 auto'
    },
    contactTitle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '1rem',
      color: '#ffffff'
    },
    contactSubtitle: {
      fontSize: '1.125rem',
      textAlign: 'center',
      color: '#9CA3AF',
      marginBottom: '3rem'
    },
    contactInfoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '2rem',
      marginTop: '2rem'
    },
    contactCard: {
      backgroundColor: '#1F2937',
      padding: '2.5rem 2rem',
      borderRadius: '1rem',
      textAlign: 'center',
      border: '1px solid #374151',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    contactIconWrapper: {
      display: 'inline-flex',
      padding: '1.25rem',
      backgroundColor: '#111827',
      borderRadius: '50%',
      marginBottom: '1.5rem',
      border: '2px solid #374151'
    },
    contactLabel: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '0.75rem',
      color: '#ffffff'
    },
    contactValue: {
      fontSize: '1rem',
      color: '#ffffff',
      textDecoration: 'none',
      transition: 'color 0.3s ease',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.container}>
      {/* Add CSS animation keyframes */}
      <style>
        {`
          @keyframes slideLeftToRight {
            0% {
              background-position: left center;
            }
            100% {
              background-position: right center;
            }
          }
          
          .hero-background-animated {
            background-size: 120% auto !important;
            animation: slideLeftToRight 12s ease-in-out infinite alternate;
          }

          /* Model card hover effects */
          .model-card:hover {
            transform: translateY(-8px);
            border-color: #4DA0D6 !important;
            box-shadow: 0 12px 24px rgba(77, 160, 214, 0.2);
          }

          .model-card:hover img {
            transform: scale(1.1);
          }
        `}
      </style>

      {/* --- HEADER --- */}
      <header style={styles.header}>
        <div style={styles.logo}>WARP</div>

        <nav style={styles.nav}>
          <a
            href="#models"
            style={styles.navLink}
            onMouseEnter={(e) => {
              e.target.style.color = themeColors.primary;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Models
          </a>
          <a
            href="#features"
            style={styles.navLink}
            onMouseEnter={(e) => {
              e.target.style.color = themeColors.primary;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Features
          </a>
          <button
            onClick={() => handleAuthenticatedNavigation('/map')}
            style={{
              ...styles.navLink,
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = themeColors.primary;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FiMapPin size={16} />
            Find Stations
          </button>
          <a
            href="#contact"
            style={styles.navLink}
            onMouseEnter={(e) => {
              e.target.style.color = themeColors.primary;
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Contact
          </a>
        </nav>

        {/* --- AUTH SECTION --- */}
        <div style={styles.authSection}>
          {account ? (
            <div
              className="user-dropdown-container"
              style={styles.userInfo}
            >
              <div
                style={styles.userAvatar}
                onClick={toggleDropdown}
              >
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
                  <a
                    href="#"
                    style={styles.dropdownItem}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/profile');
                      setIsDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = themeColors.primary;
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderRadius = '0.375rem';
                      e.target.style.boxShadow = '0 4px 12px rgba(77, 160, 214, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderRadius = '0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FiUser /> My Profile
                  </a>
                  <a
                    href="#"
                    style={styles.dropdownItem}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAuthenticatedNavigation('/charging-history');
                      setIsDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = themeColors.primary;
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderRadius = '0.375rem';
                      e.target.style.boxShadow = '0 4px 12px rgba(77, 160, 214, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderRadius = '0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FiShoppingCart /> Charging History
                  </a>
                  <div style={{ borderTop: '1px solid #374151', margin: '0.5rem 0' }}></div>
                  <button
                    onClick={handleLogout}
                    style={{ ...styles.dropdownItem, color: '#F87171' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#DC2626';
                      e.target.style.transform = 'scale(1.02)';
                      e.target.style.color = '#ffffff';
                      e.target.style.borderRadius = '0.375rem';
                      e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.transform = 'scale(1)';
                      e.target.style.color = '#F87171';
                      e.target.style.borderRadius = '0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authSection}>
              <Link
                to="/login"
                style={{ ...styles.authButton, ...styles.loginButton }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={{ ...styles.authButton, ...styles.registerButton }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.backgroundColor = themeColors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.backgroundColor = themeColors.primary;
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section style={styles.heroSection}>
        <div style={styles.heroBackground} className="hero-background-animated"></div>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Instant Tracking</h1>
          <p style={styles.heroSubtitle}>
            Find your desired charging stations in no time.
          </p>
          <div style={{ ...styles.heroButtons, '@media (min-width: 640px)': { flexDirection: 'row' } }}>
            <button
              onClick={() => handleAuthenticatedNavigation('/map')}
              style={styles.mapButton}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.backgroundColor = themeColors.primaryHover;
                e.target.style.boxShadow = '0 8px 20px rgba(77, 160, 214, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.backgroundColor = themeColors.primary;
                e.target.style.boxShadow = '0 4px 12px rgba(77, 160, 214, 0.2)';
              }}
            >
              <FiMapPin size={20} />
              Find Charging Stations
            </button>
          </div>
        </div>
      </section>

      {/* --- Models Section --- */}
      <section style={styles.modelsSection} id="models">
        <h2 style={styles.modelsTitle}>Electric Vehicle Models</h2>
        <p style={styles.modelsSubtitle}>Compatible vehicles with our charging network</p>
        <div style={styles.modelsGrid}>
          {[
            {
              brand: "Tesla",
              model: "Model 3",
              connectorType: "CCS",
              image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=500&h=300&fit=crop"
            },
            {
              brand: "Tesla",
              model: "Model S",
              connectorType: "CCS",
              image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&h=300&fit=crop"
            },
            {
              brand: "VinFast",
              model: "VF 8",
              connectorType: "CCS / Type 2",
              image: "https://images.unsplash.com/photo-1678909265375-e7c6d65d7c21?w=500&h=300&fit=crop"
            },
            {
              brand: "VinFast",
              model: "VF 9",
              connectorType: "CCS / Type 2",
              image: "https://images.unsplash.com/photo-1609521263047-f8f9b2a0e6f3?w=500&h=300&fit=crop"
            },
            {
              brand: "Audi",
              model: "e-tron GT",
              connectorType: "CCS",
              image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=500&h=300&fit=crop"
            },
            {
              brand: "Audi",
              model: "Q4 e-tron",
              connectorType: "CCS / Type 2",
              image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&h=300&fit=crop"
            }
          ].map((car, index) => (
            <div key={index} style={styles.modelCard} className="model-card">
              <div style={styles.modelImageWrapper}>
                <img 
                  src={car.image} 
                  alt={`${car.brand} ${car.model}`}
                  style={styles.modelImage}
                  onError={(e) => {
                    e.target.src = evImage;
                  }}
                />
              </div>
              <div style={styles.modelContent}>
                <h3 style={styles.modelBrand}>{car.brand}</h3>
                <h4 style={styles.modelName}>{car.model}</h4>
                <div style={styles.connectorBadge}>
                  <FiZap size={16} style={{ marginRight: '0.5rem' }} />
                  <span>{car.connectorType}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Features Section --- */}
      <section style={styles.featuresSection} id="features">
        <h2 style={styles.featuresTitle}>Why WARP?</h2>
        <div style={styles.featuresGrid}>
          {[
            {
              icon: FiTarget,
              title: "Far-Ranged",
              text: "Locate all charging stations in 100 miles.",
            },
            {
              icon: FiSearch,
              title: "Easy Tracking",
              text: "Help you track charging stations in less than 1 minute.",
            },
            {
              icon: FiMapPin,
              title: "Find your stations now",
              text: "Never worry about running out of power.",
              isMapButton: true,
            },
          ].map((feature, index) => (
            <div key={index} style={styles.featureCard}>
              <div style={styles.featureIcon}>
                <feature.icon size={32} color={themeColors.primary} />
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureText}>{feature.text}</p>
              {feature.isMapButton && (
                <button
                  onClick={() => handleAuthenticatedNavigation('/map')}
                  style={{
                    backgroundColor: themeColors.primary,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '600',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    fontSize: '0.875rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(77, 160, 214, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.backgroundColor = themeColors.primaryHover;
                    e.target.style.boxShadow = '0 6px 16px rgba(77, 160, 214, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.backgroundColor = themeColors.primary;
                    e.target.style.boxShadow = '0 2px 8px rgba(77, 160, 214, 0.2)';
                  }}
                >
                  <FiMapPin size={14} />
                  Open Map
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>WARP</div>
        <p style={styles.footerText}>
          Powering the future of urban mobility.
        </p>
      </footer>

      {/* --- Contact Section --- */}
      <section style={styles.contactSection} id="contact">
        <div style={styles.contactContainer}>
          <h2 style={styles.contactTitle}>Contact Us</h2>
          <p style={styles.contactSubtitle}>Get in touch with our team</p>
          
          <div style={styles.contactInfoGrid}>
            <div style={styles.contactCard}>
              <div style={styles.contactIconWrapper}>
                <FiMail size={28} color={themeColors.primary} />
              </div>
              <h3 style={styles.contactLabel}>Email</h3>
              <a 
                href="mailto:warp.evsystem@gmail.com" 
                style={styles.contactValue}
                onMouseEnter={(e) => e.target.style.color = themeColors.primary}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                warp.evsystem@gmail.com
              </a>
            </div>
            
            <div style={styles.contactCard}>
              <div style={styles.contactIconWrapper}>
                <FiPhone size={28} color={themeColors.primary} />
              </div>
              <h3 style={styles.contactLabel}>Phone</h3>
              <a 
                href="tel:0987654321" 
                style={styles.contactValue}
                onMouseEnter={(e) => e.target.style.color = themeColors.primary}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                0987654321
              </a>
            </div>
            
            <div style={styles.contactCard}>
              <div style={styles.contactIconWrapper}>
                <FiMapPin size={28} color={themeColors.primary} />
              </div>
              <h3 style={styles.contactLabel}>Address</h3>
              <p style={styles.contactValue}>
                258 Bach Dang Street<br />
                Da Nang, Viet Nam
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EbikeHomePage;
