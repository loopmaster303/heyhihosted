import { PRUNA_MODEL_IDS, getPrunaModelMapping } from '@/config/pruna-models';

describe('Pruna model mappings', () => {
  it('keeps every exported Pruna model ID backed by a mapping', () => {
    for (const modelId of PRUNA_MODEL_IDS) {
      expect(getPrunaModelMapping(modelId)).toBeDefined();
    }
  });

  it('maps VACE character references to src_ref_images', () => {
    const input = getPrunaModelMapping('vace')?.buildInput({
      prompt: 'same character in a rainy street',
      srcRefImages: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });

    expect(input).toEqual(expect.objectContaining({
      prompt: 'same character in a rainy street',
      src_ref_images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    }));
  });

  it('maps p-video-animate source video and subject reference separately', () => {
    const input = getPrunaModelMapping('p-video-animate')?.buildInput({
      prompt: 'follow this motion',
      video: 'https://media.pollinations.ai/motion.mp4',
      image: 'https://media.pollinations.ai/subject.jpg',
      audio: false,
    });

    expect(input).toEqual(expect.objectContaining({
      instruction_prompt: 'follow this motion',
      video: 'https://media.pollinations.ai/motion.mp4',
      image: 'https://media.pollinations.ai/subject.jpg',
      save_audio: false,
    }));
  });

  it('maps p-video-replace source video, frame reference, and additional references', () => {
    const input = getPrunaModelMapping('p-video-replace')?.buildInput({
      prompt: 'replace the lead performer',
      video: 'https://media.pollinations.ai/source.mp4',
      image: [
        'https://media.pollinations.ai/frame.jpg',
        'https://media.pollinations.ai/ref-a.jpg',
        'https://media.pollinations.ai/ref-b.jpg',
      ],
    });

    expect(input).toEqual(expect.objectContaining({
      instruction_prompt: 'replace the lead performer',
      video: 'https://media.pollinations.ai/source.mp4',
      image: 'https://media.pollinations.ai/frame.jpg',
      reference_images: [
        'https://media.pollinations.ai/ref-a.jpg',
        'https://media.pollinations.ai/ref-b.jpg',
      ],
      save_audio: true,
    }));
  });

  it('clamps p-image-upscale target into the supported 1-128 MP range', () => {
    const mapping = getPrunaModelMapping('p-image-upscale');

    expect(mapping?.buildInput({ prompt: '', width: 256, height: 256 })).toEqual(
      expect.objectContaining({ target: 1 }),
    );
    expect(mapping?.buildInput({ prompt: '', width: 20000, height: 20000 })).toEqual(
      expect.objectContaining({ target: 128 }),
    );
    expect(mapping?.buildInput({ prompt: '' })).toEqual(
      expect.objectContaining({ target: 4 }),
    );
  });

  it('maps wan-image-small square UI sizes to aspect_ratio without invalid 1024 dimensions', () => {
    const input = getPrunaModelMapping('wan-image-small')?.buildInput({
      prompt: 'a tiny ceramic robot on a desk',
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
    });

    expect(input).toEqual(expect.objectContaining({
      prompt: 'a tiny ceramic robot on a desk',
      aspect_ratio: '1:1',
      output_format: 'jpg',
      output_quality: 80,
    }));
    expect(input).not.toHaveProperty('width');
    expect(input).not.toHaveProperty('height');
  });

  it('normalizes wan-image-small custom sizes below the API maximum and onto 16px steps', () => {
    const input = getPrunaModelMapping('wan-image-small')?.buildInput({
      prompt: 'custom crop',
      width: 1024,
      height: 768,
      aspectRatio: 'custom',
    });

    expect(input).toEqual(expect.objectContaining({
      aspect_ratio: 'custom',
      width: 896,
      height: 672,
    }));
  });

  it('maps unsupported qwen-image custom UI sizes to a supported aspect ratio', () => {
    const input = getPrunaModelMapping('qwen-image')?.buildInput({
      prompt: 'wide cinema frame',
      width: 1344,
      height: 768,
      aspectRatio: 'custom',
    });

    expect(input).toEqual(expect.objectContaining({
      aspect_ratio: '16:9',
    }));
    expect(input).not.toHaveProperty('width');
    expect(input).not.toHaveProperty('height');
  });

  it('adds dimensions only for p-image custom aspect ratio and keeps them within schema limits', () => {
    const input = getPrunaModelMapping('p-image')?.buildInput({
      prompt: 'poster',
      width: 1536,
      height: 1024,
      aspectRatio: 'custom',
    });

    expect(input).toEqual(expect.objectContaining({
      aspect_ratio: 'custom',
      width: 1440,
      height: 1024,
    }));
    expect(input).not.toHaveProperty('output_format');
    expect(input).not.toHaveProperty('output_quality');
  });

  it('does not send forbidden output format fields for p-image-edit', () => {
    const input = getPrunaModelMapping('p-image-edit')?.buildInput({
      prompt: 'make it cinematic',
      image: 'https://example.com/input.jpg',
      aspectRatio: '1:1',
    });

    expect(input).toEqual(expect.objectContaining({
      prompt: 'make it cinematic',
      aspect_ratio: '1:1',
      images: ['https://example.com/input.jpg'],
      reference_image: '1',
    }));
    expect(input).not.toHaveProperty('output_format');
    expect(input).not.toHaveProperty('output_quality');
  });

  it('normalizes wan video aspect ratios to the schema-supported landscape or portrait values', () => {
    const input = getPrunaModelMapping('wan-t2v')?.buildInput({
      prompt: 'portrait camera move',
      width: 768,
      height: 1344,
      aspectRatio: 'custom',
    });

    expect(input).toEqual(expect.objectContaining({
      aspect_ratio: '9:16',
    }));
  });

  it('normalizes p-video custom UI dimensions to schema-supported aspect ratios', () => {
    const portraitInput = getPrunaModelMapping('p-video')?.buildInput({
      prompt: 'portrait product reveal',
      width: 768,
      height: 1344,
      aspectRatio: 'custom',
    });
    const landscapeInput = getPrunaModelMapping('p-video')?.buildInput({
      prompt: 'landscape product reveal',
      width: 1344,
      height: 768,
      aspectRatio: 'custom',
    });

    expect(portraitInput).toEqual(expect.objectContaining({ aspect_ratio: '9:16' }));
    expect(landscapeInput).toEqual(expect.objectContaining({ aspect_ratio: '16:9' }));
  });
});
