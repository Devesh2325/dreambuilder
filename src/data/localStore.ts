/**
 * Where demo mode keeps its data. localStorage holds only about 5 MB, which a few uploads
 * or published versions use up, so this uses IndexedDB, and falls back to localStorage
 * only where IndexedDB isn't available.
 */

const DB_NAME = 'flowpilot_local';
const STORE = 'state';
const RECORD = 'backend';
/** The old home of this data. Anything there moves across on first use. */
export const LEGACY_KEY = 'flowpilot_local_backend';

const FULL_MESSAGE = 'This browser has run out of storage for demo mode. Delete some images or projects, then try again.';

export interface LocalStore<S> {
  read: () => Promise<S | undefined>;
  /** Changes run one at a time, so two tabs can't overwrite each other's work. */
  update: <T>(change: (state: S | undefined) => { state: S; result: T }) => Promise<T>;
}

const isQuotaError = (error: unknown) =>
  error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

const friendly = (error: unknown): Error => (isQuotaError(error) ? new Error(FULL_MESSAGE) : error instanceof Error ? error : new Error('Could not save your changes.'));

function legacyRead<S>(): S | undefined {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as S) : undefined;
  } catch {
    return undefined;
  }
}

function localStorageStore<S>(): LocalStore<S> {
  return {
    read: async () => legacyRead<S>(),
    update: async (change) => {
      const { state, result } = change(legacyRead<S>());
      try {
        localStorage.setItem(LEGACY_KEY, JSON.stringify(state));
      } catch (error) {
        throw friendly(error);
      }
      return result;
    },
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Demo storage is blocked by another tab.'));
  });
}

function indexedDbStore<S>(database: IDBDatabase): LocalStore<S> {
  // Reading and writing inside one transaction is what makes each change safe across tabs.
  const withStore = <T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, finish: (value: T) => void, fail: (error: unknown) => void) => void) =>
    new Promise<T>((resolve, reject) => {
      let value: T;
      let failure: unknown;
      const transaction = database.transaction(STORE, mode);
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = () => reject(friendly(failure ?? transaction.error));
      transaction.onerror = () => reject(friendly(failure ?? transaction.error));
      work(
        transaction.objectStore(STORE),
        (result) => { value = result; },
        (error) => {
          failure = error;
          transaction.abort();
        },
      );
    });

  return {
    read: () => withStore<S | undefined>('readonly', (store, finish) => {
      const request = store.get(RECORD);
      request.onsuccess = () => finish(request.result as S | undefined);
    }),
    update: <T,>(change: (state: S | undefined) => { state: S; result: T }) => withStore<T>('readwrite', (store, finish, fail) => {
      const request = store.get(RECORD);
      request.onsuccess = () => {
        try {
          const { state, result } = change(request.result as S | undefined);
          store.put(state, RECORD);
          finish(result);
        } catch (error) {
          fail(error);
        }
      };
    }),
  };
}

export async function openLocalStore<S>(): Promise<LocalStore<S>> {
  if (typeof indexedDB === 'undefined') return localStorageStore<S>();
  let store: LocalStore<S>;
  try {
    store = indexedDbStore<S>(await openDatabase());
  } catch {
    // Some private browsing modes refuse IndexedDB.
    return localStorageStore<S>();
  }
  const legacy = legacyRead<S>();
  if (legacy !== undefined) {
    await store.update((current) => ({ state: current ?? legacy, result: undefined }));
    try {
      // Frees the space, which is what stops the old error from coming back.
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Harmless: IndexedDB already has the data, and it's preferred from now on.
    }
  }
  return store;
}
