import.meta.glob(['#workers/audio.worklet', '#workers/video.worklet', '!#workers/video.worklet']);
import.meta.glob(['#widgets/*', '#widgets/forms/*', '!#widgets/secret.ts']);
import.meta.glob('#raw/template.ts', { query: '?raw' });
import.meta.glob(['./icons/*.ts', '!#icons/legacy.ts']);
