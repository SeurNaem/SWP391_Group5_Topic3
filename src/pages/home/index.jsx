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
    </div>
  );
};

export default EbikeHomePage;
