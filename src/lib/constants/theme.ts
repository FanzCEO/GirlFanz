export const theme = {
  colors: {
    // Brand colors for FANZ
    primary: '#7C4DFF',
    primaryDark: '#5A2DFF', 
    secondary: '#00D1FF',
    accent: '#FF3D71',
    
    // Semantic colors (dark theme default)
    background: {
      page: '#000000',
      elevated: '#0E0E14',
      card: '#12121A',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    
    text: {
      primary: '#F7F7FB',
      secondary: 'rgba(247, 247, 251, 0.72)',
      muted: 'rgba(247, 247, 251, 0.5)',
      inverse: '#000000'
    },
    
    border: {
      muted: 'rgba(247, 247, 251, 0.1)',
      elevated: 'rgba(247, 247, 251, 0.2)',
      focus: '#7C4DFF'
    },
    
    status: {
      success: '#16D19A',
      warning: '#FFB020', 
      danger: '#FF5757',
      info: '#00D1FF'
    }
  },
  
  typography: {
    fonts: {
      sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace"
    },
    
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '22px',
      '2xl': '28px',
      '3xl': '36px',
      '4xl': '48px'
    },
    
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px', 
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
    24: '96px'
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
    md: '0 6px 24px rgba(0, 0, 0, 0.12)',
    lg: '0 12px 48px rgba(0, 0, 0, 0.16)',
    glow: '0 0 24px rgba(124, 77, 255, 0.3)'
  },
  
  motion: {
    duration: {
      fast: '120ms',
      normal: '200ms',
      slow: '300ms'
    },
    
    easing: {
      default: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  }
} as const;

export type Theme = typeof theme;

// CSS custom properties for runtime theming
export const cssVars = `
  :root {
    --color-primary: ${theme.colors.primary};
    --color-primary-dark: ${theme.colors.primaryDark};
    --color-secondary: ${theme.colors.secondary};
    --color-accent: ${theme.colors.accent};
    
    --bg-page: ${theme.colors.background.page};
    --bg-elevated: ${theme.colors.background.elevated};
    --bg-card: ${theme.colors.background.card};
    --bg-overlay: ${theme.colors.background.overlay};
    
    --text-primary: ${theme.colors.text.primary};
    --text-secondary: ${theme.colors.text.secondary};
    --text-muted: ${theme.colors.text.muted};
    
    --border-muted: ${theme.colors.border.muted};
    --border-elevated: ${theme.colors.border.elevated};
    --border-focus: ${theme.colors.border.focus};
    
    --success: ${theme.colors.status.success};
    --warning: ${theme.colors.status.warning};
    --danger: ${theme.colors.status.danger};
    --info: ${theme.colors.status.info};
    
    --font-sans: ${theme.typography.fonts.sans};
    --font-mono: ${theme.typography.fonts.mono};
    
    --radius-sm: ${theme.borderRadius.sm};
    --radius-md: ${theme.borderRadius.md};
    --radius-lg: ${theme.borderRadius.lg};
    --radius-xl: ${theme.borderRadius.xl};
    
    --shadow-sm: ${theme.shadows.sm};
    --shadow-md: ${theme.shadows.md};
    --shadow-lg: ${theme.shadows.lg};
    --shadow-glow: ${theme.shadows.glow};
    
    --motion-fast: ${theme.motion.duration.fast};
    --motion-normal: ${theme.motion.duration.normal};
    --motion-slow: ${theme.motion.duration.slow};
    
    --ease-default: ${theme.motion.easing.default};
  }
  
  /* Dark theme is default */
  [data-theme="light"] {
    --bg-page: #0B0B10;
    --bg-elevated: #12121A;
    --text-primary: #FFFFFF;
    --text-secondary: rgba(255, 255, 255, 0.72);
    --border-muted: rgba(255, 255, 255, 0.08);
  }
`;