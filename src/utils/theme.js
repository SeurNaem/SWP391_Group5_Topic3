// Theme configuration for the EV Charging Station Management System

export const themeColors = {
    primary: '#4da0d6',
    primaryHover: '#3b8bc6',
    primaryLight: '#6bb2df',
    primaryDark: '#357ba8',
    primaryBgLight: 'rgba(77, 160, 214, 0.1)',
    primaryBgLighter: 'rgba(77, 160, 214, 0.05)',
};

export const antdTheme = {
    token: {
        colorPrimary: themeColors.primary,
        colorLink: themeColors.primary,
        colorInfo: themeColors.primary,
        colorSuccess: themeColors.primary,
    },
    components: {
        Button: {
            colorPrimary: themeColors.primary,
            colorPrimaryHover: themeColors.primaryHover,
            colorPrimaryActive: themeColors.primaryDark,
        },
        Input: {
            colorPrimary: themeColors.primary,
            colorPrimaryHover: themeColors.primaryHover,
        },
        Select: {
            colorPrimary: themeColors.primary,
            colorPrimaryHover: themeColors.primaryHover,
        },
    },
};

// Utility functions for consistent styling
export const getThemeStyle = (type = 'primary') => {
    const styles = {
        primary: {
            color: themeColors.primary,
        },
        primaryBg: {
            backgroundColor: themeColors.primary,
            color: '#ffffff',
        },
        primaryLight: {
            backgroundColor: themeColors.primaryBgLight,
            color: themeColors.primary,
        },
        primaryBorder: {
            borderColor: themeColors.primary,
        },
        gradient: {
            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryLight})`,
            color: '#ffffff',
        },
    };

    return styles[type] || styles.primary;
};

export default themeColors;
