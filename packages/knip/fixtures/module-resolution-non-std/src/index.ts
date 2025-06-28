import bin from '../dist/cli.cjs';
import Icon from './icon.svg?raw';
import Icon404 from './icon-404.svg';
import Styles1 from 'style-loader!css-loader?modules!./styles.css';
import Styles2 from '!style-loader!css-loader?modules!./styles.css';
import Styles3 from '!!style-loader!css-loader?modules!./styles.css';
import Styles4 from '-!style-loader!css-loader?modules!./styles.css';
import unresolved from './unresolved';
import unresolvedPkg from 'unresolved';
import unresolvedOrg from '@org/unresolved';

import Github from '@svg-icons/fa-brands/github.svg';
import Briefcase from '@svg-icons/heroicons-outline/briefcase.svg';

import SomeSVG from 'common/image.svg';
import SomePNG from 'common/image.png';

import './globals.css';
import 'styles/base.css';

import '~/styles/aliased.css';
import '~/common/aliased.svg';
