import { MediaRevision } from '../store/useMediaEditorStore';

export interface SynthesizedPromptResult {
  finalPrompt: string;
  revisionInstruction: string;
  parentVersion?: number;
  detectedStyle?: string;
  detectedRatio?: string;
  summaryNote: string;
}

const INDONESIAN_SUBJECT_MAP: Record<string, string> = {
  kucing: 'cat, adorable feline',
  anjing: 'dog, canine',
  harimau: 'tiger, majestic big cat',
  singa: 'lion, majestic lion',
  burung: 'bird',
  kuda: 'horse, majestic stallion',
  kelinci: 'rabbit, cute bunny',
  naga: 'dragon, mythical dragon',
  robot: 'futuristic cyborg robot',
  mobil: 'sports car, vehicle',
  motor: 'motorcycle, superbike',
  rumah: 'modern cozy house, architecture',
  gedung: 'cyberpunk skyscraper building',
  wanita: 'woman, beautiful female portrait',
  pria: 'man, handsome male portrait',
  gadis: 'young girl, beautiful anime girl',
  anak: 'child, cute kid',
};

const COLOR_MAP: Record<string, string> = {
  biru: 'vibrant blue color theme, blue fur, glowing blue highlights',
  merah: 'crimson red color theme, vibrant red accents',
  kuning: 'bright golden yellow, warm yellow glow',
  hijau: 'emerald green, vibrant green accents',
  hitam: 'midnight obsidian black, sleek dark shading',
  putih: 'pure snow white, luminous white highlights',
  emas: 'radiant metallic gold, warm golden aura',
  ungu: 'vivid royal purple, glowing neon violet accents',
  pink: 'soft pastel pink, bright magenta glow',
  silver: 'shimmering metallic silver',
  'abu-abu': 'clean monochromatic grey',
  cokelat: 'warm earthy brown',
  orange: 'vibrant sunset orange, warm amber tones',
  blue: 'vibrant blue color theme, glowing blue highlights',
  red: 'crimson red, vibrant red accents',
  yellow: 'bright golden yellow',
  green: 'emerald green',
  black: 'midnight black',
  white: 'pure white',
  gold: 'radiant metallic gold',
  purple: 'vivid royal purple',
};

const ACCESSORY_MAP: Record<string, string> = {
  kacamata: 'wearing stylish dark sunglasses, cool tinted eyewear',
  'kacamata hitam': 'wearing sleek black sunglasses',
  topi: 'wearing stylish cap hat',
  jaket: 'wearing stylish modern jacket',
  sayap: 'with majestic glowing angel wings',
  mahkota: 'wearing royal golden crown',
  headphone: 'wearing high-tech glowing audio headphones',
  jas: 'wearing sharp formal suit',
  baju: 'wearing stylish outfit',
};

const BG_MAP: Record<string, string> = {
  malam: 'night time, dark starry night sky, ambient night lighting',
  'malam hari': 'night time, dark starry night sky, glowing city lights',
  'luar angkasa': 'outer space, cosmic nebula, glowing stars and galaxies in background',
  pantai: 'sunny tropical beach, turquoise ocean waves, warm sunlight',
  hutan: 'lush enchanted forest, sunbeams through misty trees',
  cyberpunk: 'cyberpunk futuristic metropolis at night, neon lights reflections on wet street',
  kamar: 'cozy aesthetic modern room, ambient warm lighting',
  salju: 'winter landscape with falling snowflakes, frosty icy ground',
  sunset: 'golden hour sunset, dramatic warm sun rays, vivid orange sky',
  hujan: 'cinematic rainy weather, water droplets, puddle reflections',
};

/**
 * Extracts the primary subject from the revision chain.
 * Traverses back to root revision (v1) so modifiers like "buat warna biru"
 * never lose the original subject (e.g. "kucing").
 */
function findRootSubject(revisions: MediaRevision[]): { subjectId: string; subjectEn: string } {
  if (!revisions || revisions.length === 0) return { subjectId: '', subjectEn: '' };

  for (const rev of revisions) {
    const text = (rev.revisionInstruction || rev.prompt || '').toLowerCase();
    for (const [idKey, enVal] of Object.entries(INDONESIAN_SUBJECT_MAP)) {
      if (text.includes(idKey)) {
        return { subjectId: idKey, subjectEn: enVal };
      }
    }
  }

  // Fallback to first revision's cleaned first few words
  const firstRev = revisions[0];
  const firstText = (firstRev.revisionInstruction || firstRev.prompt || '')
    .replace(/, (Photorealistic|Anime|Cyberpunk|3D Render|Cinematic|Oil Painting).*/i, '')
    .replace(/, highly detailed.*/i, '')
    .trim();

  return { subjectId: firstText, subjectEn: firstText };
}

/**
 * Intelligently combines user revision instructions with previous prompt context.
 * Resolves conversational instructions into accurate visual prompts for diffusion models.
 */
export function synthesizeContextualPrompt(
  userInput: string,
  parentRevision: MediaRevision | null,
  options?: {
    allRevisions?: MediaRevision[];
    currentStyle?: string;
    currentRatio?: string;
    currentModel?: string;
    language?: 'id' | 'en';
  }
): SynthesizedPromptResult {
  const trimmed = userInput.trim();
  const lang = options?.language || 'id';

  if (!parentRevision) {
    // Brand new concept from scratch
    const lower = trimmed.toLowerCase();
    let translated = trimmed;
    for (const [idKey, enVal] of Object.entries(INDONESIAN_SUBJECT_MAP)) {
      if (lower.includes(idKey)) {
        translated = trimmed.replace(new RegExp(idKey, 'gi'), enVal);
        break;
      }
    }

    return {
      finalPrompt: translated,
      revisionInstruction: trimmed,
      summaryNote: lang === 'id' ? `Membuat konsep visual baru: "${trimmed}"` : `Created visual concept: "${trimmed}"`,
    };
  }

  const parentVersion = parentRevision.version;
  const lowerInput = trimmed.toLowerCase();
  const allRevs = options?.allRevisions || [parentRevision];

  // 1. Identify Root Subject (e.g. "kucing" -> "cat, adorable feline")
  const { subjectId, subjectEn } = findRootSubject(allRevs);
  const baseSubject = subjectEn || subjectId || 'subject';

  // 2. Detect style
  let detectedStyle = options?.currentStyle || parentRevision.style || 'Photorealistic';
  if (lowerInput.includes('anime') || lowerInput.includes('manga')) {
    detectedStyle = 'Anime / Manga';
  } else if (lowerInput.includes('cyberpunk') || lowerInput.includes('neon')) {
    detectedStyle = 'Cyberpunk';
  } else if (lowerInput.includes('3d') || lowerInput.includes('isometric') || lowerInput.includes('blender')) {
    detectedStyle = '3D Render';
  } else if (lowerInput.includes('cinematic') || lowerInput.includes('film')) {
    detectedStyle = 'Cinematic';
  } else if (lowerInput.includes('photorealistic') || lowerInput.includes('realistis') || lowerInput.includes('foto')) {
    detectedStyle = 'Photorealistic';
  } else if (lowerInput.includes('oil painting') || lowerInput.includes('lukisan')) {
    detectedStyle = 'Oil Painting';
  }

  // 3. Extract all cumulative modifiers (colors, accessories, background, etc.)
  const modifierTokens: string[] = [];

  // Check color
  for (const [cKey, cVal] of Object.entries(COLOR_MAP)) {
    if (lowerInput.includes(cKey)) {
      modifierTokens.push(cVal);
      break;
    }
  }

  // If previous revisions had color and user didn't specify a new color, retain parent color
  if (modifierTokens.length === 0 && parentRevision.prompt) {
    for (const [cKey, cVal] of Object.entries(COLOR_MAP)) {
      if (parentRevision.prompt.toLowerCase().includes(cKey)) {
        modifierTokens.push(cVal);
        break;
      }
    }
  }

  // Check accessories
  for (const [aKey, aVal] of Object.entries(ACCESSORY_MAP)) {
    if (lowerInput.includes(aKey)) {
      modifierTokens.push(aVal);
    }
  }

  // Check background
  for (const [bgKey, bgVal] of Object.entries(BG_MAP)) {
    if (lowerInput.includes(bgKey)) {
      modifierTokens.push(bgVal);
      break;
    }
  }

  // If no mapped tokens matched, include user input directly
  if (modifierTokens.length === 0) {
    modifierTokens.push(trimmed);
  }

  // 4. Construct the unified high-fidelity visual prompt
  const modifiersString = modifierTokens.join(', ');
  const finalPrompt = `${baseSubject}, ${modifiersString}, ${detectedStyle} style, masterpiece composition, highly detailed, 8k resolution, cinematic lighting`;

  const summaryNote = lang === 'id'
    ? `Revisi v${parentVersion} (${baseSubject.split(',')[0]}): ${trimmed}`
    : `Revising v${parentVersion} (${baseSubject.split(',')[0]}): ${trimmed}`;

  return {
    finalPrompt,
    revisionInstruction: trimmed,
    parentVersion,
    detectedStyle,
    summaryNote,
  };
}
