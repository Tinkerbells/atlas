export interface ThemeToken {
  name: string;
  value: string;
  category:
  | 'color'
  | 'motion'
  | 'shape'
  | 'spacing'
  | 'typography'
  | 'shadow'
  | 'state';
  description?: string;
}

export interface SemanticColor {
  primary: string;
  secondary?: string;
  error?: string;
  success?: string;
}

export interface SemanticSpacing {
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

export interface SemanticShape {
  none: string;
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface SemanticState {
  hover: string;
  focus: string;
  active: string;
  disabled: string;
}

export interface SemanticZIndex {
  dropdown: string;
  sticky: string;
  fixed: string;
  modal: string;
  popover: string;
  tooltip: string;
  toast: string;
  overlay: string;
}

export interface SemanticTypography {
  body: {
    large: string;
    medium: string;
    small: string;
  };
  heading: {
    large: string;
    medium: string;
    small: string;
  };
  fontFamily: {
    base: string;
    heading: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface SemanticElevation {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface SemanticMotion {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface Theme {
  name: string;
  type: 'light' | 'dark';
  version?: string;
  tokens?: ThemeToken[];
  semantic: {
    colors: {
      background: SemanticColor;
      surface: SemanticColor;
      text: SemanticColor;
      border: SemanticColor;
      primary: SemanticColor;
      secondary: SemanticColor;
      accent: SemanticColor;
    };
    spacing: SemanticSpacing;
    shape: SemanticShape;
    typography: SemanticTypography;
    elevation: SemanticElevation;
    shadows: SemanticElevation;
    motion: SemanticMotion;
    state: SemanticState;
    zIndex: SemanticZIndex;
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}

export const DEFAULT_THEME: Theme = {
  name: 'Gemini Dark',
  type: 'dark',
  version: '1.0',
  semantic: {
    colors: {
      background: {
        primary: '#1e1f20',
        secondary: '#282a2c',
      },
      surface: {
        primary: '#131314',
        secondary: '#1e1f20',
      },
      text: {
        primary: '#e3e3e3',
        secondary: '#9a9b9c',
      },
      border: {
        primary: '#444746',
        secondary: '#8e918f',
        error: '#f55e57',
        success: '#1aa64a',
      },
      primary: {
        primary: '#a8c7fa',
        secondary: '#1f3760',
      },
      secondary: {
        primary: '#7fcfff',
        secondary: '#004a77',
      },
      accent: {
        primary: '#6dd58c',
        secondary: '#0f5223',
      },
    },
    spacing: {
      xs: '4px',
      s: '8px',
      m: '12px',
      l: '16px',
      xl: '20px',
      xxl: '24px',
      xxxl: '28px',
    },
    shape: {
      none: '0px',
      small: '4px',
      medium: '12px',
      large: '16px',
      full: '9999px',
    },
    typography: {
      body: {
        large: '1rem',
        medium: '0.875rem',
        small: '0.75rem',
      },
      heading: {
        large: '2rem',
        medium: '1.75rem',
        small: '1.5rem',
      },
      fontFamily: {
        base: "'Google Sans Flex', -apple-system, BlinkMacSystemFont, sans-serif",
        heading: "'Google Sans Flex', sans-serif",
        monospace: "'Fira Code', 'Courier New', monospace",
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
      },
    },
    elevation: {
      none: '0 0 0 0 rgb(0 0 0 / 0)',
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    shadows: {
      xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      none: 'none',
    },
    motion: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        ease: 'cubic-bezier(0.2, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    state: {
      hover: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(168, 199, 250, 0.12)',
      active: 'rgba(168, 199, 250, 0.16)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    zIndex: {
      dropdown: '1000',
      sticky: '1020',
      fixed: '1030',
      modal: '1040',
      popover: '1050',
      tooltip: '1060',
      toast: '1070',
      overlay: '1080',
    },
    breakpoints: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
};

