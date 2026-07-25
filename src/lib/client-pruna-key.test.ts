import {
  getStoredPrunaKey,
  PRUNA_KEY_CHANGED_EVENT,
  PRUNA_KEY_STORAGE_KEY,
  removeStoredPrunaKey,
  storePrunaKey,
} from './client-pruna-key';
import { getPrunaHeaders } from './pruna-key';

describe('client Pruna key helpers', () => {
  beforeEach(() => localStorage.clear());

  it('stores a normalized key and exposes only the internal request header', () => {
    expect(storePrunaKey('  pruna_test_1234567890  ')).toBe('pruna_test_1234567890');
    expect(localStorage.getItem(PRUNA_KEY_STORAGE_KEY)).toBe('pruna_test_1234567890');
    expect(getStoredPrunaKey()).toBe('pruna_test_1234567890');
    expect(getPrunaHeaders()).toEqual({ 'X-Pruna-Key': 'pruna_test_1234567890' });
  });

  it('rejects invalid keys and removes invalid legacy storage values', () => {
    expect(storePrunaKey('short')).toBeNull();
    localStorage.setItem(PRUNA_KEY_STORAGE_KEY, 'bad key');
    expect(getStoredPrunaKey()).toBeNull();
    expect(localStorage.getItem(PRUNA_KEY_STORAGE_KEY)).toBeNull();
  });

  it('dispatches a change event when storing and removing', () => {
    const listener = jest.fn();
    window.addEventListener(PRUNA_KEY_CHANGED_EVENT, listener);

    storePrunaKey('pruna_test_1234567890');
    removeStoredPrunaKey();

    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener(PRUNA_KEY_CHANGED_EVENT, listener);
  });
});
