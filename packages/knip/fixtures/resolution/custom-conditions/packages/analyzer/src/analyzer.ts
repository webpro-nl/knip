import { format as wave } from '#formats/wave';
import { format as traversal } from '#formats/../src/wave';
import tuning from '#tuning';

export const analyze = () => `${wave()}${traversal()}@${tuning.concertPitch}`;
