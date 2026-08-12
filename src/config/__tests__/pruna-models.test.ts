import { PRUNA_MODEL_IDS, getPrunaModelMapping, isPrunaModel } from '@/config/pruna-models';

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

  it('translates zimage aspect_ratio into width/height and strips the ratio field', () => {
    const input = getPrunaModelMapping('zimage')?.buildInput({
      prompt: 'a red fox',
      params: { aspect_ratio: '16:9', num_inference_steps: 12, go_fast: true },
    });

    expect(input).toEqual(expect.objectContaining({
      prompt: 'a red fox',
      width: 1344,
      height: 768,
      num_inference_steps: 12,
      go_fast: true,
    }));
    // Die API kennt aspect_ratio nicht — es darf nicht durchgereicht werden.
    expect(input).not.toHaveProperty('aspect_ratio');
  });

  it('keeps explicit zimage width/height ahead of the ratio table', () => {
    const input = getPrunaModelMapping('zimage')?.buildInput({
      prompt: 'a red fox',
      width: 512,
      height: 640,
    });

    expect(input).toEqual(expect.objectContaining({ width: 512, height: 640 }));
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
      images: [
        'https://media.pollinations.ai/frame.jpg',
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
    }));
    expect(input).not.toHaveProperty('reference_image');
    expect(input).not.toHaveProperty('output_format');
    expect(input).not.toHaveProperty('output_quality');
  });

  it('maps P-Video start and end frames to distinct documented fields', () => {
    const input = getPrunaModelMapping('p-video')?.buildInput({
      prompt: 'transition between frames',
      image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
    });

    expect(input).toEqual(expect.objectContaining({
      image: 'https://example.com/start.jpg',
      last_frame_image: 'https://example.com/end.jpg',
    }));
  });

  it('accepts normal reference image plumbing for VACE', () => {
    const input = getPrunaModelMapping('vace')?.buildInput({
      prompt: 'consistent cast',
      image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    });
    expect(input).toEqual(expect.objectContaining({
      src_ref_images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    }));
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

  it('recognizes p-image-ideogram as a Pruna model', () => {
    expect(getPrunaModelMapping('p-image-ideogram')).toBeDefined();
    expect(isPrunaModel('p-image-ideogram')).toBe(true);
  });

  it('recognizes p-flux-klein as a Pruna model', () => {
    expect(getPrunaModelMapping('p-flux-klein')).toBeDefined();
    expect(isPrunaModel('p-flux-klein')).toBe(true);
  });

  it('p-image-ideogram buildInput uses params', () => {
    const input = getPrunaModelMapping('p-image-ideogram')?.buildInput({
      prompt: 'test',
      params: { thinking: 'high', image_size: '1K' },
    });
    expect(input?.thinking).toBe('high');
    expect(input?.image_size).toBe('1K');
  });

  it('p-flux-klein buildInput passes up to 5 images', () => {
    const input = getPrunaModelMapping('p-flux-klein')?.buildInput({
      prompt: 'test',
      image: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(input?.images).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('lets a schema value beat the baked-in default', () => {
    const mapping = getPrunaModelMapping('wan-t2v');
    const input = mapping?.buildInput({
      prompt: 'x',
      params: { resolution: '720p', frames_per_second: 24 },
    });
    expect(input?.resolution).toBe('720p');
    expect(input?.frames_per_second).toBe(24);
  });

  it('sends the second image as the end frame for wan-i2v', () => {
    const mapping = getPrunaModelMapping('wan-i2v');
    const input = mapping?.buildInput({
      prompt: 'x',
      image: ['https://a/1.png', 'https://a/2.png'],
    });
    expect(input?.image).toBe('https://a/1.png');
    expect(input?.last_image).toBe('https://a/2.png');
  });

  it('passes a source video to vace', () => {
    const mapping = getPrunaModelMapping('vace');
    const input = mapping?.buildInput({
      prompt: 'x',
      video: 'https://a/clip.mp4',
    });
    expect(input?.src_video).toBe('https://a/clip.mp4');
  });

  it('builds an upscale request without a prompt', () => {
    const mapping = getPrunaModelMapping('p-image-upscale');
    const input = mapping?.buildInput({
      prompt: '',
      image: 'https://a/1.png',
      params: { target: 8 },
    });
    expect(input?.prompt).toBeUndefined();
    expect(input?.target).toBe(8);
  });
