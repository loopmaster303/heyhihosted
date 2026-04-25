import { POST } from './route';

const getPollinationsChatCompletionMock = jest.fn();
const resolvePollenKeyMock = jest.fn((_request?: unknown) => '');

jest.mock('@/ai/flows/pollinations-chat-flow', () => ({
  getPollinationsChatCompletion: (...args: unknown[]) => getPollinationsChatCompletionMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (request: unknown) => resolvePollenKeyMock(request),
}));

describe('/api/enhance-prompt route', () => {
  const responseJson = jest.fn((body: unknown) => ({
    json: async () => body,
  }));

  beforeEach(() => {
    getPollinationsChatCompletionMock.mockReset();
    resolvePollenKeyMock.mockReset();
    resolvePollenKeyMock.mockReturnValue('');
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('uses claude-fast as the primary enhancer and gemini-fast as fallback', async () => {
    getPollinationsChatCompletionMock
      .mockRejectedValueOnce(new Error('primary down'))
      .mockResolvedValueOnce({ responseText: 'A compact enhanced prompt.' });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'portrait at dusk',
        modelId: 'flux',
        language: 'de',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ modelId: 'claude-fast' }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ modelId: 'gemini-fast' }),
    );
  });

  it('adds researched visual suggestions when a pollen key is available', async () => {
    resolvePollenKeyMock.mockReturnValue('pk_test_research');
    getPollinationsChatCompletionMock
      .mockResolvedValueOnce({
        responseText: '- brutalist transit hub at blue hour\n- 35mm low-angle tracking frame\n- wet concrete specular reflections',
      })
      .mockResolvedValueOnce({
        responseText: 'A runner crosses a brutalist transit hub at blue hour, low-angle 35mm tracking perspective, wet concrete reflections, crisp editorial sports framing.',
      });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'runner in a futuristic city plaza',
        modelId: 'nanobanana-2',
        language: 'en',
      }),
    });

    await POST(request as any);
    const body = responseJson.mock.calls.at(-1)?.[0] as {
      researchModelId?: string;
      researchSuggestions?: string[];
    };

    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        modelId: 'perplexity-fast',
        systemPrompt: expect.stringContaining('visual reference researcher'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('<web_research_suggestions>'),
      }),
    );
    expect(body.researchModelId).toBe('perplexity-fast');
    expect(body.researchSuggestions).toEqual([
      'brutalist transit hub at blue hour',
      '35mm low-angle tracking frame',
      'wet concrete specular reflections',
    ]);
  });

  it('skips the research pass for compose models even when a pollen key is available', async () => {
    resolvePollenKeyMock.mockReturnValue('pk_test_research');
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '120 bpm, glossy synth bass, crisp clap transients, euphoric pop topline, bright festival energy.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'uplifting festival pop with glossy synth bass',
        modelId: 'compose',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledTimes(1);
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
      }),
    );
  });

  it('uses a pure t2i FLUX.1 prompt aligned to BFL prompt ordering', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A red paper lantern swings above a narrow alley, warm evening light, painterly atmosphere, quiet city mood, no visible logos.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'red paper lantern in a narrow alley at dusk',
        modelId: 'flux',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('FLUX.1 is text-to-image only in this app'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject -> Action -> Style -> Context'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Word order matters: put the most important visual concepts early'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('Negative Prompt:'),
      }),
    );
  });

  it('maps legacy imagen selections to the maintained zimage archetype', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject:** A confident fashion portrait\n* **Action & Interaction:** Elegant still pose\n* **Environment & Framing:** Clean studio medium shot\n* **Lighting & Style:** Soft directional studio light\n* **Positive Constraints:** polished composition, no visible logos',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'fashion portrait',
        modelId: 'imagen',
        language: 'de',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Z-Image Turbo is text-to-image only in this app'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('positive constraints'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('Imagen 4 prompt specialist'),
      }),
    );
  });

  it('maps legacy klein-large selections to the maintained klein archetype', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A weathered boxer standing under cool stadium spill light, damp skin texture, taut shoulders, foggy night air, shallow depth of field, no visible logos.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'weathered boxer portrait at night',
        modelId: 'klein-large',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Assume the model needs more help than Klein 9B'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Front-load the most important nouns and visual facts early'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Avoid vague adjectives unless they are anchored to a visible detail'),
      }),
    );
  });

  it('uses a stricter klein prompt for the smaller 4B model', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A compact red commuter scooter parked beside a pale concrete wall, front wheel angled slightly left, overcast daylight, crisp shadow edge, clean product framing.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'red commuter scooter product photo',
        modelId: 'klein',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Assume the model needs more help than Klein 9B'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Front-load the most important nouns and visual facts early'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Avoid vague adjectives unless they are anchored to a visible detail'),
      }),
    );
  });

  it('maps flux-klein to the canonical klein 4B enhancement prompt', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A compact scooter parked in diffuse daylight with crisp material separation and clean product framing.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'compact scooter product shot',
        modelId: 'flux-klein',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Assume the model needs more help than Klein 9B'),
      }),
    );
  });

  it('maps flux-klein-9b and klein-9b to the maintained klein prompt family', async () => {
    getPollinationsChatCompletionMock.mockResolvedValue({
      responseText: 'A cinematic portrait with deliberate scene-specific light and atmospheric depth.',
    });

    const requestA = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cinematic portrait',
        modelId: 'flux-klein-9b',
        language: 'en',
      }),
    });

    const requestB = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cinematic portrait',
        modelId: 'klein-9b',
        language: 'en',
      }),
    });

    await POST(requestA as any);
    await POST(requestB as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Assume the model needs more help than Klein 9B'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Assume the model needs more help than Klein 9B'),
      }),
    );
  });

  it('uses a dedicated qwen-image prompt with text and layout-aware dual-mode guidance', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Mode:** T2I generation\n* **Subject & Intent:** Editorial poster portrait\n* **Action / Edit:** Calm direct gaze\n* **Setting & Layout:** Bold centered poster composition\n* **Style, Lighting & Camera:** Clean studio light, polished fashion still\n* **Text / Typography:** "CITY RUN" centered at top in bold condensed sans\n* **Constraints / Preservation:** high legibility, balanced hierarchy',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'fashion poster portrait with the text CITY RUN',
        modelId: 'qwen-image',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Qwen Image Plus prompt specialist'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Text / Typography'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('layout relationships'),
      }),
    );
  });

  it('uses a dedicated p-image prompt with subject-behavior-style-environment structure', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject:** Red commuter scooter\n* **Behavior / Pose:** Parked in three-quarter product view\n* **Style:** Clean commercial product photography\n* **Environment:** Pale studio floor with soft daylight\n* **Constraints:** crisp materials, no watermark',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'red commuter scooter product photo',
        modelId: 'p-image',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Pruna P-Image prompt specialist'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject -> Behavior -> Style -> Environment'),
      }),
    );
  });

  it('uses a dedicated p-image-edit prompt with modification-target-preservation structure', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Modification Instruction:** Change the banner text to "CITY RUN"\n* **Change Target:** The large top banner\n* **Preservation Requirements:** Keep the same person, pose, layout, and lighting\n* **Reference Roles:** Use the attached poster as the base layout\n* **Constraints:** crisp typography, no extra text',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'change the poster headline to CITY RUN and keep everything else the same',
        modelId: 'p-image-edit',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Pruna P-Image-Edit specialist'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Modification Instruction'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Preservation Requirements'),
      }),
    );
  });

  it('uses the updated gpt-image dual-mode prompt with conservative t2i fallback', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A cinematic product photo of a matte black sneaker on a clean white pedestal, soft studio light, crisp shadows, premium commercial styling, no visible text or logos.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'product photo of a matte black sneaker on a white pedestal',
        modelId: 'gpt-image',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Weak or ambiguous wording alone is NOT enough for I2I mode.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('If the request could plausibly be either mode, default to T2I_MODE.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Never use "die Person" by itself as an I2I trigger.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Change only X. Keep everything else the same.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('identity, geometry, layout, background, and brand elements'),
      }),
    );
  });

  it('uses the updated gptimage-large dual-mode prompt with conservative t2i fallback', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A premium product photograph of a silver watch on dark stone, neutral daylight color temperature, crisp reflections, precise typography, no watermark, no extra text, no logos.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'premium product photograph of a silver watch on dark stone',
        modelId: 'gptimage-large',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('If the request could plausibly be either mode, default to T2I_MODE.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Never use "die Person" by itself as an I2I trigger.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('best-in-class text rendering'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Change only X. Keep everything else the same.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('identity, geometry, layout, background, and brand elements'),
      }),
    );
  });

  it('uses the updated nanobanana dual-mode prompt with narrower edit triggers', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject:** A stylish woman in a rain-soaked neon alley\n* **Action/Edit:** She stands still under a glowing umbrella\n* **Environment:** Wet pavement, soft reflections, layered city lights\n* **Lighting & Style:** 35mm film look, moody blue-magenta glow, soft bokeh\n* **Text Elements:** no visible text',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'stylish woman in a rain-soaked neon alley',
        modelId: 'nanobanana',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Weak or ambiguous wording alone is NOT enough for I2I mode.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Never use "die Person" by itself as an I2I trigger.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Reference Lock: strict'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject + Action + Location/context + Composition + Style'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Reference images + Relationship instruction + New scenario'),
      }),
    );
  });

  it('uses the updated nanobanana-pro dual-mode prompt with guide-aligned pro instructions', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject & Materiality:** Premium technical backpack with tight ballistic nylon weave and matte aluminum hardware\n* **Spatial Layout:** Foreground straps, midground bag body, clean background panel\n* **Cinematography:** Key light, soft fill, subtle rim, 85mm commercial product look\n* **Preservation Lock:** Keep logo placement and silhouette unchanged\n* **Text Rendering:** "TRAIL SYSTEM" in crisp sans serif on the front label',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'premium technical backpack product shot',
        modelId: 'nanobanana-pro',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Weak or ambiguous wording alone is NOT enough for I2I mode.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject + Composition + Action + Location/context + Style'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Reference images + Relationship instruction + New scenario'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('put desired text in "double quotes"'),
      }),
    );
  });

  it('removes real-time web search grounding claims from nanobanana-2', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject Identity:** A runner in a futuristic city plaza\n* **World Context:** Detailed urban signage and grounded architectural context\n* **Typography/Text:** "CITY RUN" on a nearby billboard\n* **Cinematography:** Cool daylight, long-lens compression, crisp detail\n* **Aspect Ratio:** 9:16',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'runner in a futuristic city plaza',
        modelId: 'nanobanana-2',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.not.stringContaining('real-time web search grounding'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('world knowledge and reasoning'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Weak or ambiguous wording alone is NOT enough for I2I mode.'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Reference images + Relationship instruction + New scenario'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Never use "die Person" by itself as an I2I trigger.'),
      }),
    );
  });

  it('uses a pure t2i grok-imagine prompt with no edit or reference instructions (and keeps the legacy grok-image id mapped to it)', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A cybernetic fox sprinting through a neon-lit alley at midnight, rain-slicked pavement reflecting blue and magenta signs, low camera angle looking up, mist curling around its legs. "CITY RUN" glows on a sign overhead. No blur, no extra text.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cybernetic fox running through a neon alley',
        modelId: 'grok-imagine',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Subject + Action/Pose/Mood + Setting + Style'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('NEVER use quality-inflation tags'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Write like a human describing a photograph'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('Preservation Lock'),
      }),
    );
  });

  it('uses a text-triggered grok-video prompt with modern t2v and i2v guidance', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A cybernetic fox sprints through a neon forest at midnight, legs kicking up wet leaves, fast tracking shot from behind through the trees, blue-purple volumetric light filtering through branches. AUDIO: intense synthwave pulse, rain hiss, metallic footfalls on wet ground. Smooth motion, no jitter, no deformation.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cybernetic fox sprints through neon forest at midnight',
        modelId: 'grok-video',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('describe what happens — subject, action, camera movement'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Animate this image'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('I2V mode is triggered only from the text prompt'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('NEVER use quality-inflation tags'),
      }),
    );
  });

  it('uses a modern seedream5 prompt without web-search claims', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject:** Elegant perfume bottle on polished stone\n* **Setting:** Clean editorial tabletop with soft shadow falloff\n* **Style:** Luxury product photography with refined realism\n* **Lighting:** Soft diffused key light and subtle reflective fill\n* **Technical:** "AURA" on label, 4k detail, no watermark, no extra text',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'luxury perfume bottle on polished stone',
        modelId: 'seedream5',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.not.stringContaining('real-time web search integration'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject > Setting > Style > Lighting > Technical'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Text that should appear in the image must be in "double quotes"'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Weak or ambiguous wording alone is NOT enough for I2I mode.'),
      }),
    );
  });

  it('uses a Wan 2.6 prompt with conservative text-triggered t2v and i2v guidance', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '**Prompt:** [0-3s] A rider leans into motion as the camera pushes forward through drifting smoke. **Negative Prompt:** flicker, temporal flicker, identity drift, face morphing, blurry, watermark',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'reference frame of a woman on a motorcycle, animate this with a slow dolly in and drifting smoke',
        modelId: 'wan',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('I2V mode is triggered only from the text prompt'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('reference image, attached image, this image, starting frame, reference frame'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject -> Action -> Camera -> Environment/Lighting -> Style -> Duration/shot structure'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Do not re-describe identity, wardrobe, setting, or style unless the user explicitly asks for a change'),
      }),
    );
  });

  it('uses a dedicated p-video prompt with Pruna-style motion blueprint guidance', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Mode:** I2V animation\n* **Subject & Motion:** Animate the existing frame with the rider leaning harder into the turn as dust trails peel away behind the rear wheel.\n* **Scene & Camera:** Continue from the provided frame with a low tracking camera that glides beside the bike and then eases into a slight forward push.\n* **Lighting, Style & Pacing:** Harsh late-afternoon desert light, crisp commercial action look, fast opening acceleration followed by a brief controlled settle.\n* **Constraints:** smooth motion, preserve composition, no jitter',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'animate this image of a rider in the desert with a low tracking camera and dust trails',
        modelId: 'p-video',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Pruna P-Video prompt specialist'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Subject -> Action -> Scene -> Camera -> Lighting/Atmosphere -> Style -> Timing/Pacing'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('compact motion blueprint'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('Always output a negative prompt'),
      }),
    );
  });

  it('uses an LTX-2 prompt aligned to the official t2v-only prompting guide', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A low-angle tracking shot follows a courier sprinting through a rain-soaked market, neon reflections sliding across puddles as fabric snaps in the wind and distant sirens bleed into the soundscape.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'courier sprinting through a rain-soaked market at night',
        modelId: 'ltx-2',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('LTX-2 is text-to-video only via Pollinations'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Shot -> Scene -> Action -> Character -> Camera -> Audio'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Use present tense only'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('Output exactly one flowing English paragraph'),
      }),
    );
  });

  it('uses a pure t2i z-image turbo prompt with positive constraints only', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject:** A chrome tea kettle on a clean countertop\n* **Action & Interaction:** Soft steam drifting upward\n* **Environment & Framing:** Minimal kitchen, three-quarter product view\n* **Lighting & Style:** Bright editorial daylight, crisp reflections\n* **Positive Constraints:** sharp focus, clean geometry, no lettering, polished metal detail',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'chrome tea kettle product image in a minimal kitchen',
        modelId: 'zimage',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Z-Image Turbo is text-to-image only in this app'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('subject -> action / pose -> environment / composition -> style / lighting -> positive constraints'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('Negative Prompt:'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.not.stringContaining('1024×1024'),
      }),
    );
  });

  it('maps grok-imagine-pro to the maintained grok-imagine prompt family', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '* **Subject & Action:** A cinematic portrait with hard directional light\n* **Setting & Atmosphere:** Dark studio\n* **Style & Look:** Moody editorial realism\n* **Lighting & Camera:** 85mm portrait framing\n* **Constraints:** no blur, no watermark',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cinematic portrait with moody editorial light',
        modelId: 'grok-imagine-pro',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Grok Imagine image specialist'),
      }),
    );
  });

  it('maps wan-fast to the maintained wan video prompt family', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: '**Prompt:** A rider accelerates through drifting smoke as the camera pushes forward. **Negative Prompt:** flicker, identity drift, jitter, blur',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'animate a rider accelerating through drifting smoke',
        modelId: 'wan-fast',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('Wan 2.6 video prompt specialist'),
      }),
    );
  });

  it('teaches kontext to detect edit triggers before using edit-mode instructions', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'Change the red leather jacket to matte black. Keep the face, pose, and background unchanged.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'change the jacket to black, keep the face and pose',
        modelId: 'kontext',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('I2I-Trigger'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('while maintaining the same style, composition, and object placement'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('same face, hairstyle, expression, and distinctive features'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('keep the same font style, color, and similar text length'),
      }),
    );
  });

  it('teaches kontext to fall back to text-to-image mode when no edit trigger is present', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A cinematic portrait of a woman in neon rain, medium close-up, moody reflections, soft backlight, clean background with no visible text.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'cinematic portrait of a woman in neon rain',
        modelId: 'kontext',
        language: 'en',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-fast',
        systemPrompt: expect.stringContaining('**Otherwise:** -> T2I_MODE'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('More explicit is better'),
      }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: expect.stringContaining('For larger changes, prefer one edit at a time or a short step-by-step sequence'),
      }),
    );
  });
});
