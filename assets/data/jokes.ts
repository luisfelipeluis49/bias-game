import enData from './jokes-en.json';
import frData from './jokes-fr.json';
import ptBR from './jokes-pt-BR.json';

export type Joke = {
  id: string;
  text: string;
  kind: 'joke' | 'quote' | 'fact' | 'riddle' | 'story';
};

export type JokeBank = Record<'en' | 'fr' | 'pt-BR', Joke[]>;

const en = enData as Joke[];
const fr = frData as Joke[];
const ptBRJokes = ptBR as Joke[];

export const jokes: JokeBank = {
  en,
  fr,
  'pt-BR': ptBRJokes,
};

export const DEFAULT_LANG: keyof JokeBank = 'en';
