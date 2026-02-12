export function sanitizeEnhancedPrompt(text: string): string {
  if (!text) return '';
  let out = text.trim();

  // Remove code fences and quotes around entire text
  out = out.replace(/^```[a-z]*\n([\s\S]*?)\n```$/i, '$1').trim();
  out = out.replace(/^"([\s\S]*)"$/m, '$1').trim();
  out = out.replace(/^'([\s\S]*)'$/m, '$1').trim();

  // Clean up structural labels and list markers by line
  const lines = out.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  const cleanedLines: string[] = [];
  const labelRegex = /^(Referenz|Änderung|Änderungen|Zielobjekt|Zielbild|Motiv|Stiltransfer|Charakterstruktur|Perspektive|Texturen|Humor|Ergebnis|Ausgabe|Output|Prompt|Szene|Setting|Komposition|Farbpalette|Reference|Target object|Target|Subject|Change|Changes|Identity|Identity preserved|Style transfer|Scene|Setting|Composition|Palette|Color palette|Perspective|Textures|Result|Background|Lighting|Wardrobe|Eyes|Skin tones|Crop)\s*:/i;
  const labelTokens = new Set([
    'referenz','änderung','änderungen','zielobjekt','zielbild','motiv','stiltransfer','charakterstruktur','perspektive','texturen','humor','ergebnis','ausgabe','output','prompt','szene','setting','komposition','farbpalette',
    'reference','target object','target','subject','change','changes','identity','identity preserved','style transfer','scene','setting','composition','palette','color palette','perspective','textures','result','background','lighting','wardrobe','eyes','skin tones','crop'
  ]);
  for (let line of lines) {
    // Strip leading numeric list markers first (handles "1Target ..." cases)
    line = line.replace(/^\d+(?:[)\.:\-])?\s*/, '');
    line = line.replace(/^\d+(?=[A-Za-z])/, '');

    // Strip simple label prefixes
    if (labelRegex.test(line)) {
      line = line.replace(labelRegex, '').trim();
      if (!line) continue;
    }
    // Handle multi-label headers like "Reference, change, identity preserved: ..."
    if (/:/.test(line)) {
      const idx = line.indexOf(':');
      const head = line.slice(0, idx).trim();
      const body = line.slice(idx + 1).trim();
      const headParts = head.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (headParts.length > 0 && headParts.every(p => labelTokens.has(p))) {
        line = body;
      }
    }

    // Strip leading bullets / numbering
    line = line
      .replace(/^[-–•\*]\s+/, '')
      .replace(/^\d+\)\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();
    if (line) cleanedLines.push(line);
  }
  out = cleanedLines.join(' ');

  // Drop common prefixes
  out = out.replace(/^Verbesserter Prompt:\s*/i, '')
           .replace(/^Enhanced Prompt:\s*/i, '')
           .replace(/^Improved:\s*/i, '')
           .replace(/^Result:\s*/i, '')
           .trim();

  // Remove mid-sentence labels like "... Change: ..." or "... Target object: ..."
  out = out.replace(/(^|[\.;,!?\)])\s*(Referenz|Änderung|Änderungen|Zielobjekt|Zielbild|Motiv|Stiltransfer|Charakterstruktur|Perspektive|Texturen|Humor|Ergebnis|Ausgabe|Output|Prompt|Szene|Setting|Komposition|Farbpalette|Reference|Target object|Target|Subject|Change|Changes|Identity|Identity preserved|Style transfer|Scene|Setting|Composition|Palette|Color palette|Perspective|Textures|Result|Background|Lighting|Wardrobe|Eyes|Skin tones|Crop)\s*:\s*/gi, '$1 ');

  // Remove square bracket labels (e.g., "[Texture Package]:", "[Subject]:", etc.)
  // Common in video enhancement prompts (Wan, Seedance)
  out = out.replace(/\[([^\]]+)\]\s*:\s*/g, '');

  // Remove empty square brackets
  out = out.replace(/\[\s*\]/g, '');

  // Clean up "--negative_prompt" prefix (keep the actual negative keywords)
  out = out.replace(/--negative_prompt\s+/gi, 'Negative: ');

  // Collapse whitespace/newlines
  out = out.replace(/[ \t\f\v]+/g, ' ');
  out = out.replace(/\s*\n+\s*/g, ' ');
  return out.trim();
}
