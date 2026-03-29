import stringSimilarity from 'string-similarity';

const cleanSpaces = (text = '') => text.replace(/\s+/g, ' ').trim();

const removeAccents = (text = '') => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D');

const phraseOverrides = {
  'thawart lung': { value: 'thắt lưng', display: 'thắt lưng' },
  'thawart lungg': { value: 'thắt lưng', display: 'thắt lưng' },
  'vi guucii': { value: 'ví gucci', display: 'ví Gucci' },
  'vi guuci': { value: 'ví gucci', display: 'ví Gucci' },
  'giay dep': { value: 'giày dép', display: 'giày dép' },
  'sneeker': { value: 'sneaker', display: 'sneaker' }
};

const tokenCorrections = {
  thawart: 'thắt',
  thauart: 'thắt',
  lung: 'lưng',
  luong: 'lưng',
  vi: 'ví',
  via: 'ví',
  guucii: 'gucci',
  guuci: 'gucci',
  gucci: 'gucci',
  giay: 'giày',
  dep: 'dép',
  giaydep: 'giày dép',
  sneeker: 'sneaker',
  sneker: 'sneaker'
};

const vocabulary = [
  { label: 'Thắt lưng', value: 'thắt lưng' },
  { label: 'Thắt lưng nam', value: 'thắt lưng nam' },
  { label: 'Ví Gucci', value: 'ví gucci' },
  { label: 'Ví da', value: 'ví da' },
  { label: 'Ví nam', value: 'ví nam' },
  { label: 'Giày dép', value: 'giày dép' },
  { label: 'Giày dép nam', value: 'giày dép nam' },
  { label: 'Sneaker', value: 'sneaker' },
  { label: 'Giày sneaker', value: 'giày sneaker' },
  { label: 'Giày thể thao', value: 'giày thể thao' }
];

const normalizedVocabulary = vocabulary.map((item) => ({
  ...item,
  normalized: cleanSpaces(removeAccents(item.value).toLowerCase())
}));

const buildTokenCandidate = (inputLower, canonical) => {
  const normalizedTokens = canonical.split(' ');
  const originalTokens = inputLower.split(' ');

  const correctedTokens = normalizedTokens.map((token, idx) => tokenCorrections[token] || originalTokens[idx] || token);
  return cleanSpaces(correctedTokens.join(' '));
};

export const normalizeUserMessage = (rawInput = '') => {
  const cleaned = cleanSpaces(rawInput);
  if (!cleaned) {
    return { processedText: '', displayLabel: '', didCorrect: false };
  }

  const lowerInput = cleaned.toLowerCase();
  const canonical = cleanSpaces(removeAccents(lowerInput));

  if (phraseOverrides[canonical]) {
    const exact = phraseOverrides[canonical];
    return {
      processedText: exact.value,
      displayLabel: exact.display || exact.value,
      didCorrect: true
    };
  }

  const tokenCandidate = buildTokenCandidate(lowerInput, canonical);
  const baseForSimilarity = tokenCandidate || canonical;

  const comparisonList = normalizedVocabulary.map((item) => item.normalized);
  const similarity = stringSimilarity.findBestMatch(baseForSimilarity, comparisonList);
  const bestIndex = similarity.bestMatchIndex;
  const bestScore = similarity.bestMatch?.rating || 0;

  if (bestScore >= 0.72 && normalizedVocabulary[bestIndex]) {
    const matched = normalizedVocabulary[bestIndex];
    return {
      processedText: matched.value,
      displayLabel: matched.label || matched.value,
      didCorrect: matched.normalized !== canonical
    };
  }

  if (tokenCandidate && tokenCandidate !== lowerInput) {
    return {
      processedText: tokenCandidate,
      displayLabel: tokenCandidate,
      didCorrect: true
    };
  }

  return {
    processedText: cleaned,
    displayLabel: '',
    didCorrect: false
  };
};
