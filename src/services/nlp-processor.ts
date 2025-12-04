import natural from 'natural';
import { removeStopwords } from 'stopword';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

export class NLPProcessor {
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  preprocessText(text: string): string[] {
    // Convert to lowercase and tokenize
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    
    // Remove stopwords
    const filteredTokens = removeStopwords(tokens ?? []);
    
    // Stem tokens
    const stemmedTokens = filteredTokens.map(token => this.stemmer.stem(token));
    
    return stemmedTokens;
  }

  calculateSimilarity(text1: string, text2: string): number {
    const key = `similarity_${text1}_${text2}`;
    const cached = cache.get<number>(key);
    
    if (cached !== undefined) {
      return cached;
    }

    const tokens1 = this.preprocessText(text1);
    const tokens2 = this.preprocessText(text2);

    // Calculate Jaccard similarity
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    const similarity = union.size === 0 ? 0 : intersection.size / union.size;
    
    cache.set(key, similarity);
    return similarity;
  }

  extractKeywords(text: string, maxKeywords: number = 5): string[] {
    const tokens = this.preprocessText(text);
    const frequency: Record<string, number> = {};

    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  detectIntent(text: string): string {
    const intents = [
      { pattern: ['price', 'cost', 'how much'], intent: 'pricing' },
      { pattern: ['how to', 'guide', 'tutorial'], intent: 'instructions' },
      { pattern: ['problem', 'error', 'not working'], intent: 'troubleshooting' },
      { pattern: ['contact', 'email', 'phone', 'support'], intent: 'contact' },
      { pattern: ['feature', 'specification', 'what can'], intent: 'features' }
    ];

    const tokens = this.preprocessText(text);
    
    for (const { pattern, intent } of intents) {
      if (pattern.some(keyword => tokens.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }
}