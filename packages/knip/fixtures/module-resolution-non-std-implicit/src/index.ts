import 'dir/main.ts';

import SomeSVG from './common/image.svg';

import Icon from './icon.svg';

import './global.css';

// By exception, .css files will be resolved because `.css` is not added to virtual path extensions, since `.css.ts`
// files on disk are common (in contrast to e.g. `.svg.ts`; binaries like `.png.ts` can be safely ignored).
import 'styles/base.css';
