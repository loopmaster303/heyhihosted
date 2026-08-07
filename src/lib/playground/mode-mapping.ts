export type PlaygroundMode = 't2i' | 'i2i' | 't2v' | 'i2v';

export interface ModeCandidate {
  id: string;
  kind: 'image' | 'video';
  supportsReference: boolean;
  requiresReference: boolean;
}

export function modesFor(model: ModeCandidate): PlaygroundMode[] {
  const out: PlaygroundMode[] = [];
  if (model.kind === 'image') {
    if (!model.requiresReference) out.push('t2i');
    if (model.supportsReference) out.push('i2i');
  } else {
    if (!model.requiresReference) out.push('t2v');
    if (model.supportsReference) out.push('i2v');
  }
  return out;
}

export function isModelInMode(model: ModeCandidate, mode: PlaygroundMode): boolean {
  return modesFor(model).includes(mode);
}
