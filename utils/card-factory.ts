import { jokes, type Joke, type JokeBank } from '@/assets/data/jokes';
import { cardImages, type CardImageSource } from '@/assets/images';
import type { SupportedLang } from '@/hooks/use-i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Card = {
  id: string;
  text: string;
  kind: Joke['kind'];
  image: CardImageSource;
};

type DeckState = {
  jokeOrder: number[];
  jokeCursor: number;
  imageOrder: number[];
  imageCursor: number;
};

const STORAGE_KEY_PREFIX = 'bias-game/deck/';

function keyForLang(lang: SupportedLang) {
  return `${STORAGE_KEY_PREFIX}${lang}`;
}

function shuffle(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeState(lang: SupportedLang, bank: JokeBank): DeckState {
  const jokesForLang = bank[lang];
  const jokeOrder = shuffle(jokesForLang.length);
  const imageOrder = shuffle(cardImages.length);
  return { jokeOrder, jokeCursor: 0, imageOrder, imageCursor: 0 };
}

async function loadState(lang: SupportedLang, bank: JokeBank): Promise<DeckState> {
  const key = keyForLang(lang);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as DeckState;
      const jokesForLang = bank[lang];
      if (
        parsed.jokeOrder?.length === jokesForLang.length &&
        parsed.imageOrder?.length === cardImages.length
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore and recreate
  }
  return normalizeState(lang, bank);
}

async function saveState(lang: SupportedLang, state: DeckState) {
  try {
    await AsyncStorage.setItem(keyForLang(lang), JSON.stringify(state));
  } catch {
    // non-fatal
  }
}

function nextIndex(order: number[], cursor: number): [number, number, boolean] {
  const idx = order[cursor];
  const nextCursor = cursor + 1;
  const wrapped = nextCursor >= order.length;
  return [idx, nextCursor % order.length, wrapped];
}

export async function generateCards(lang: SupportedLang, count: number): Promise<{ cards: Card[]; state: DeckState; }> {
  const bank = jokes;
  const jokesForLang = bank[lang];
  let state = await loadState(lang, bank);
  const cards: Card[] = [];
  let jokeCursor = state.jokeCursor;
  let imageCursor = state.imageCursor;
  let jokeOrder = state.jokeOrder;
  let imageOrder = state.imageOrder;

  for (let i = 0; i < count; i += 1) {
    let wrappedJoke = false;
    let wrappedImage = false;
    let jokeIdx: number;
    let imageIdx: number;

    [jokeIdx, jokeCursor, wrappedJoke] = nextIndex(jokeOrder, jokeCursor);
    [imageIdx, imageCursor, wrappedImage] = nextIndex(imageOrder, imageCursor);

    if (wrappedJoke) {
      jokeOrder = shuffle(jokesForLang.length);
      jokeCursor = 1; // we consumed first after shuffle
      jokeIdx = jokeOrder[0];
    }
    if (wrappedImage) {
      imageOrder = shuffle(cardImages.length);
      imageCursor = 1;
      imageIdx = imageOrder[0];
    }

    const joke = jokesForLang[jokeIdx];
    const image = cardImages[imageIdx];

    cards.push({
      id: `${lang}-${Date.now()}-${i}-${joke.id}-${imageIdx}`,
      text: joke.text,
      kind: joke.kind,
      image,
    });
  }

  state = {
    jokeOrder,
    imageOrder,
    jokeCursor,
    imageCursor,
  };

  await saveState(lang, state);

  return { cards, state };
}

export async function resetDeck(lang: SupportedLang) {
  const state = normalizeState(lang, jokes);
  await saveState(lang, state);
}
