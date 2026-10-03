/**
 * Ein gemeinsamer Datenpfad je Client-Ressource.
 *
 * Anlass ist ein gemessener Sturm: sechs Instanzen von `usePollenKey` brachten
 * sechs Timer und sechs Anfragen an `/api/pollen/account` pro Minute, und jede
 * weitere gemountete Komponente verdoppelte das. Der Hook war kein Datenpfad,
 * sondern ein Verstaerker — die Zahl der Netzwerk-Calls wuchs mit der Zahl der
 * Instanzen.
 *
 * Dieser Store dreht das Verhaeltnis um: pro Ressource und Schluessel gibt es
 * genau einen laufenden Abruf (In-Flight-Deduplizierung), einen kurzen
 * TTL-Puffer gegen Doppelarbeit, eine Abonnenten-Liste fuer alle Instanzen und
 * einen Zeitstempel, an dem sich ein Fokus-Refresh drosseln laesst.
 *
 * Lebensdauer: Daten bleiben liegen, solange mindestens eine Instanz
 * abonniert. Ist der letzte Abonnent weg, faellt der Puffer weg und der
 * naechste Mount holt frisch. Ein laufender Abruf ueberlebt dieses Aufraeumen
 * bewusst: React mountet Effekte im Dev-Modus doppelt, und beide Durchlaeufe
 * sollen dieselbe Zusage teilen statt zwei Anfragen zu schicken.
 */

export interface ResourceSnapshot<T> {
  /** Letzte erfolgreiche Antwort; null, solange nichts geladen wurde oder der letzte Versuch scheiterte. */
  data: T | null;
  isLoading: boolean;
  /** Letzter Fehlschlag (Netz oder Auswertung). Wird beim naechsten Versuch geloescht. */
  error: unknown;
  /** Zeitpunkt des letzten erfolgreichen Abrufs; null heisst "nicht verlaesslich geladen". */
  fetchedAt: number | null;
}

export interface LoadOptions {
  /** Umgeht TTL und Drosselung — fuer Verbinden, Trennen und manuelles Neuladen. */
  force?: boolean;
  /** Mindestabstand zum letzten Abruf; juengere Aufrufe werden verworfen. */
  minIntervalMs?: number;
}

export interface ResourceStore<T> {
  /** Stabiler Snapshot pro Schluessel — Pflicht fuer useSyncExternalStore. */
  getSnapshot(key: string): ResourceSnapshot<T>;
  subscribe(key: string, listener: () => void): () => void;
  /** Laedt bei Bedarf. Gleichzeitige Aufrufe teilen sich dieselbe Zusage. */
  load(key: string, options?: LoadOptions): Promise<void>;
  /** Verwirft gepufferte Daten (z. B. beim Trennen) und weckt die Abonnenten. */
  invalidate(key?: string): void;
}

export interface ResourceStoreOptions<T> {
  load: (key: string) => Promise<T>;
  ttlMs: number;
  /** Hintergrund-Takt. Laeuft genau einmal, solange mindestens ein Abonnent haengt. */
  pollIntervalMs?: number;
}

interface Entry<T> {
  snapshot: ResourceSnapshot<T>;
  promise: Promise<void> | null;
  subscribers: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
}

const EMPTY_SNAPSHOT: ResourceSnapshot<never> = Object.freeze({
  data: null,
  isLoading: false,
  error: null,
  fetchedAt: null,
});

export function createResourceStore<T>({ load, ttlMs, pollIntervalMs }: ResourceStoreOptions<T>): ResourceStore<T> {
  const entries = new Map<string, Entry<T>>();

  const empty = (): ResourceSnapshot<T> => EMPTY_SNAPSHOT as ResourceSnapshot<T>;

  function entryFor(key: string): Entry<T> {
    let entry = entries.get(key);
    if (!entry) {
      entry = { snapshot: empty(), promise: null, subscribers: new Set(), timer: null };
      entries.set(key, entry);
    }
    return entry;
  }

  function notify(entry: Entry<T>): void {
    // Kopie der Liste: ein Abonnent darf sich waehrend der Benachrichtigung abmelden.
    for (const listener of Array.from(entry.subscribers)) listener();
  }

  function setSnapshot(entry: Entry<T>, patch: Partial<ResourceSnapshot<T>>): void {
    entry.snapshot = { ...entry.snapshot, ...patch };
    notify(entry);
  }

  function reset(entry: Entry<T>): void {
    entry.snapshot = { ...empty(), isLoading: entry.promise !== null };
    notify(entry);
  }

  async function run(entry: Entry<T>, key: string): Promise<void> {
    setSnapshot(entry, { isLoading: true, error: null });
    try {
      const data = await load(key);
      setSnapshot(entry, { data, isLoading: false, error: null, fetchedAt: Date.now() });
    } catch (error) {
      // Ein Fehlschlag darf nicht als frisch gelten: keine Daten, kein
      // Zeitstempel — der naechste Aufruf versucht es sofort erneut.
      setSnapshot(entry, { data: null, isLoading: false, error, fetchedAt: null });
    } finally {
      entry.promise = null;
    }
  }

  async function loadKey(key: string, options: LoadOptions = {}): Promise<void> {
    const { force = false, minIntervalMs } = options;
    const entry = entryFor(key);

    // In-Flight: wer waehrend eines Abrufs dazukommt, teilt sich die Zusage.
    if (entry.promise) return entry.promise;

    const { data, fetchedAt } = entry.snapshot;
    if (!force && data !== null && fetchedAt !== null) {
      const age = Date.now() - fetchedAt;
      if (age < ttlMs) return;
      if (minIntervalMs !== undefined && age < minIntervalMs) return;
    }

    entry.promise = run(entry, key);
    return entry.promise;
  }

  function subscribe(key: string, listener: () => void): () => void {
    const entry = entryFor(key);
    entry.subscribers.add(listener);

    if (pollIntervalMs && !entry.timer) {
      // Ein Takt fuer alle Instanzen, nicht einer je Instanz.
      entry.timer = setInterval(() => {
        void loadKey(key);
      }, pollIntervalMs);
    }

    return () => {
      entry.subscribers.delete(listener);
      if (entry.subscribers.size > 0) return;

      if (entry.timer) {
        clearInterval(entry.timer);
        entry.timer = null;
      }
      if (entry.promise) {
        // Laufenden Abruf stehen lassen, die gepufferten Daten aber wegwerfen:
        // ohne Abonnenten braucht sie niemand.
        entry.snapshot = empty();
      } else {
        entries.delete(key);
      }
    };
  }

  function invalidate(key?: string): void {
    if (key !== undefined) {
      const entry = entries.get(key);
      if (entry) reset(entry);
      return;
    }
    for (const entry of entries.values()) reset(entry);
  }

  return {
    getSnapshot(key: string): ResourceSnapshot<T> {
      return entries.get(key)?.snapshot ?? empty();
    },
    subscribe,
    load: loadKey,
    invalidate,
  };
}
