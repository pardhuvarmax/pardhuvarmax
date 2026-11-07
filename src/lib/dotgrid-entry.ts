// Entry for plain-HTML pages (the minimal ZenRage copy): mounts the dot grid behind everything.
import { initDotGrid } from './dotgrid';

const canvas = document.createElement('canvas');
canvas.setAttribute('aria-hidden', 'true');
canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none';
document.body.prepend(canvas);
initDotGrid(canvas, { colorVar: '--text', accentVar: '--accent', baseAlpha: 0.12 });
