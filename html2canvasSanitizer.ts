import html2canvas, { Options } from 'html2canvas';

/**
 * Helper utility to convert modern CSS color functions (oklch, oklab, light-dark)
 * into standard rgb/rgba format for html2canvas compatibility.
 */
export const parseAndConvertModernColors = (str: string): string => {
  if (!str) return str;
  let result = str;

  // Convert oklch(...)
  if (result.includes('oklch')) {
    result = result.replace(/oklch\s*\(\s*([^)]+)\s*\)/gi, (match, argsStr) => {
      try {
        const parts = argsStr.trim().split(/\s*[\/\s]\s*/);
        if (parts.length < 3) return 'rgb(100, 116, 139)';

        let l = parseFloat(parts[0]);
        if (parts[0].endsWith('%')) l /= 100;

        let c = parseFloat(parts[1]);
        if (parts[1].endsWith('%')) c /= 100;

        let h = parseFloat(parts[2]);

        let alpha = 1;
        if (parts[3]) {
          alpha = parseFloat(parts[3]);
          if (parts[3].endsWith('%')) alpha /= 100;
        }

        const hRad = (h * Math.PI) / 180;
        const a = c * Math.cos(hRad);
        const b = c * Math.sin(hRad);

        const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

        const l3 = l_ * l_ * l_;
        const m3 = m_ * m_ * m_;
        const s3 = s_ * s_ * s_;

        const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
        const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
        const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

        const gamma = (v: number) => {
          v = Math.max(0, Math.min(1, v));
          return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        };

        const r8 = Math.round(gamma(rLin) * 255);
        const g8 = Math.round(gamma(gLin) * 255);
        const b8 = Math.round(gamma(bLin) * 255);

        if (alpha < 1) {
          return `rgba(${r8}, ${g8}, ${b8}, ${alpha.toFixed(2)})`;
        }
        return `rgb(${r8}, ${g8}, ${b8})`;
      } catch {
        return 'rgb(100, 116, 139)';
      }
    });
  }

  // Convert oklab(...)
  if (result.includes('oklab')) {
    result = result.replace(/oklab\s*\(\s*([^)]+)\s*\)/gi, (match, argsStr) => {
      try {
        const parts = argsStr.trim().split(/\s*[\/\s]\s*/);
        if (parts.length < 3) return 'rgb(100, 116, 139)';

        let l = parseFloat(parts[0]);
        if (parts[0].endsWith('%')) l /= 100;

        let a = parseFloat(parts[1]);
        if (parts[1].endsWith('%')) a /= 100;

        let b = parseFloat(parts[2]);
        if (parts[2].endsWith('%')) b /= 100;

        let alpha = 1;
        if (parts[3]) {
          alpha = parseFloat(parts[3]);
          if (parts[3].endsWith('%')) alpha /= 100;
        }

        const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

        const l3 = l_ * l_ * l_;
        const m3 = m_ * m_ * m_;
        const s3 = s_ * s_ * s_;

        const rLin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
        const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
        const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

        const gamma = (v: number) => {
          v = Math.max(0, Math.min(1, v));
          return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        };

        const r8 = Math.round(gamma(rLin) * 255);
        const g8 = Math.round(gamma(gLin) * 255);
        const b8 = Math.round(gamma(bLin) * 255);

        if (alpha < 1) {
          return `rgba(${r8}, ${g8}, ${b8}, ${alpha.toFixed(2)})`;
        }
        return `rgb(${r8}, ${g8}, ${b8})`;
      } catch {
        return 'rgb(100, 116, 139)';
      }
    });
  }

  // Convert light-dark(...)
  if (result.includes('light-dark')) {
    result = result.replace(/light-dark\s*\(\s*([^,]+)\s*,\s*[^)]+\)/gi, '$1');
  }

  return result;
};

export const sanitizeClonedDocForHtml2Canvas = (clonedDoc: Document) => {
  try {
    // 1. Sanitize all <style> elements text content
    const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
    styleTags.forEach((styleEl) => {
      if (styleEl.textContent && (
        styleEl.textContent.includes('oklch') || 
        styleEl.textContent.includes('oklab') || 
        styleEl.textContent.includes('light-dark')
      )) {
        styleEl.textContent = parseAndConvertModernColors(styleEl.textContent);
      }
    });

    // 2. Sanitize all elements inline style attributes & computed color properties
    const win = clonedDoc.defaultView || window;
    const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
    const colorProps = [
      'color', 
      'background-color', 
      'border-color', 
      'border-top-color',
      'border-bottom-color',
      'border-left-color',
      'border-right-color',
      'outline-color', 
      'fill', 
      'stroke',
      'box-shadow'
    ];

    allElements.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (
        styleAttr.includes('oklch') || 
        styleAttr.includes('oklab') || 
        styleAttr.includes('light-dark')
      )) {
        el.setAttribute('style', parseAndConvertModernColors(styleAttr));
      }

      try {
        if (win && win.getComputedStyle) {
          const computed = win.getComputedStyle(el);
          colorProps.forEach((prop) => {
            const val = computed.getPropertyValue(prop);
            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('light-dark'))) {
              const converted = parseAndConvertModernColors(val);
              el.style.setProperty(prop, converted, 'important');
            }
          });
        }
      } catch {}
    });
  } catch (err) {
    console.warn('Error sanitizing modern colors for html2canvas:', err);
  }
};

/**
 * Safe wrapper around html2canvas that automatically sanitizes modern CSS colors (oklch/oklab)
 * to prevent parser crashes.
 */
export const safeHtml2Canvas = async (element: HTMLElement, options: Partial<Options> = {}): Promise<HTMLCanvasElement> => {
  const userOnClone = options.onclone;
  return html2canvas(element, {
    ...options,
    onclone: (clonedDoc, clonedEl) => {
      sanitizeClonedDocForHtml2Canvas(clonedDoc);
      if (userOnClone) {
        userOnClone(clonedDoc, clonedEl);
      }
    }
  });
};
