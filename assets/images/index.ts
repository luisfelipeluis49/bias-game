// TODO: Add ~300 AVIF images under assets/images/cards/ and list them here for the generator.
export const cardImages = [
  require('./react-logo.png'),
  require('./partial-react-logo.png'),
];

export type CardImageSource = (typeof cardImages)[number];
