import { createResourceStore } from './client-resource-store';

describe('createResourceStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('teilt gleichzeitige Abrufe: eine Anfrage fuer beide Aufrufer', async () => {
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 30_000 });

    await Promise.all([store.load('k'), store.load('k')]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot('k').data).toBe('wert');
    expect(store.getSnapshot('k').isLoading).toBe(false);
  });

  it('beantwortet Aufrufe innerhalb der TTL aus dem Puffer', async () => {
    const now = jest.spyOn(Date, 'now');
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 30_000 });

    now.mockReturnValue(1_000);
    await store.load('k');
    expect(load).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000 + 20_000);
    await store.load('k');
    expect(load).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000 + 45_000);
    await store.load('k');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('drosselt Aufrufe ueber minIntervalMs', async () => {
    const now = jest.spyOn(Date, 'now');
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 5_000 });

    now.mockReturnValue(1_000);
    await store.load('k');
    expect(load).toHaveBeenCalledTimes(1);

    // Puffer abgelaufen, Drosselfenster aber noch nicht: kein Abruf.
    now.mockReturnValue(1_000 + 10_000);
    await store.load('k', { minIntervalMs: 30_000 });
    expect(load).toHaveBeenCalledTimes(1);

    now.mockReturnValue(1_000 + 31_000);
    await store.load('k', { minIntervalMs: 30_000 });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('laedt mit force auch bei gueltigem Puffer frisch', async () => {
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 60_000 });

    await store.load('k');
    await store.load('k', { force: true });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('legt einen Fehlschlag nicht als frisch ab', async () => {
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('wert');
    const store = createResourceStore<string>({ load, ttlMs: 30_000 });

    await store.load('k');
    expect(store.getSnapshot('k').error).toBeInstanceOf(Error);
    expect(store.getSnapshot('k').data).toBeNull();
    expect(store.getSnapshot('k').fetchedAt).toBeNull();

    // Kein Warten auf die TTL: der naechste Aufruf versucht es sofort erneut.
    await store.load('k');
    expect(load).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot('k').data).toBe('wert');
    expect(store.getSnapshot('k').error).toBeNull();
  });

  it('benachrichtigt Abonnenten und raeumt ohne sie auf', async () => {
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 30_000 });
    const listener = jest.fn();

    const unsubscribe = store.subscribe('k', listener);
    await store.load('k');

    expect(listener).toHaveBeenCalled();
    expect(store.getSnapshot('k').data).toBe('wert');

    unsubscribe();
    expect(store.getSnapshot('k').data).toBeNull();
  });

  it('liefert stabile Snapshots fuer useSyncExternalStore', async () => {
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 30_000 });

    expect(store.getSnapshot('k')).toBe(store.getSnapshot('k'));

    await store.load('k');
    const snapshot = store.getSnapshot('k');
    expect(store.getSnapshot('k')).toBe(snapshot);
  });

  it('haelt fuer alle Abonnenten genau einen Takt', async () => {
    jest.useFakeTimers();
    const load = jest.fn(async () => 'wert');
    const store = createResourceStore<string>({ load, ttlMs: 1, pollIntervalMs: 60_000 });

    const unsubscribeA = store.subscribe('k', () => {});
    const unsubscribeB = store.subscribe('k', () => {});

    await jest.advanceTimersByTimeAsync(180_000);
    expect(load).toHaveBeenCalledTimes(3);

    unsubscribeA();
    unsubscribeB();
    await jest.advanceTimersByTimeAsync(180_000);
    expect(load).toHaveBeenCalledTimes(3);
  });
});

