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
  tokens: ThemeToken[];
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

export interface MaterialTheme {
  color?: {
    primary?: string;
    tertiary?: string;
    error?: string;
  };
  typography?: string;
  density?: number;
}
