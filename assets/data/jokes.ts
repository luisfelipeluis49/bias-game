export type Joke = {
  id: string;
  text: string;
  kind: 'joke' | 'story';
};

export type JokeBank = Record<'en' | 'fr' | 'pt-BR', Joke[]>;

export const jokes: JokeBank = {
  en: [
    { id: 'en-1', kind: 'joke', text: "I tried to catch fog yesterday. Mist." },
    { id: 'en-2', kind: 'joke', text: "Parallel lines have so much in common. It’s a shame they’ll never meet." },
    { id: 'en-3', kind: 'story', text: "A programmer’s keyboard broke. She spent the day debugging with one hand and felt like a pirate on land." },
    { id: 'en-4', kind: 'joke', text: "Why do bees have sticky hair? Because they use honeycombs." },
    { id: 'en-5', kind: 'story', text: "He named his Wi‑Fi ‘Loading…’ so neighbors thought their internet was broken. It worked for a week." }
  ],
  fr: [
    { id: 'fr-1', kind: 'joke', text: "Quel est le comble pour un électricien ? Ne pas être au courant." },
    { id: 'fr-2', kind: 'joke', text: "Pourquoi les canards sont toujours à l'heure ? Parce qu'ils sont dans l'étang (dans le temps)." },
    { id: 'fr-3', kind: 'story', text: "Un chat est tombé amoureux d'un pointeur laser. C'était une relation à distance, et ça tournait en rond." },
    { id: 'fr-4', kind: 'joke', text: "Quelle est la collation préférée des informaticiens ? Le cookie." },
    { id: 'fr-5', kind: 'story', text: "Elle a renommé son réveil 'Café chaud'. Maintenant, chaque matin commence avec une petite promesse." }
  ],
  'pt-BR': [
    { id: 'pt-1', kind: 'joke', text: "Por que o livro foi ao médico? Porque ele estava cheio de páginas em branco na cabeça." },
    { id: 'pt-2', kind: 'joke', text: "Qual é o cúmulo do programador? Ter medo de escuro porque tem muitos bugs." },
    { id: 'pt-3', kind: 'story', text: "Um gato perseguiu o laser pela sala inteira. Jurou que dessa vez pegaria, mas ficou só na promessa." },
    { id: 'pt-4', kind: 'joke', text: "Por que o café foi preso? Porque ele roubou um copo e ficou expresso." },
    { id: 'pt-5', kind: 'story', text: "Ela batizou o Wi‑Fi de 'Quase Lá'. Todo mundo achava que estava conectando, e ninguém reclamava." }
  ],
};

export const DEFAULT_LANG: keyof JokeBank = 'en';
