import * as NS from './barrel';
import * as Styled from './styled';
import * as pictures from './assets';

type Key = keyof typeof NS;

const key = 'anything';

NS[key as Key].resolve();

const Heading = ({ as }: { as: keyof typeof Styled }) => {
  const Element = as ? Styled[as] || Styled.h1 : Styled.h1;
  return <Element />;
};

type PictureKey = keyof typeof pictures;

interface Props {
  pictureKey: PictureKey;
}

const pictureToken = (): PictureKey => 'dog';

const Picture = (props: Props) => <img source={pictures[pictureToken()]} />;

const PictureB = (props: Props) => <Picture pictureKey={pictureToken()} />;

const PictureC = (props: Props) => <Picture pictureKey="dog" />;
