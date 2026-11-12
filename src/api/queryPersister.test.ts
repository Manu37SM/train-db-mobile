jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: () => null, set: () => {}, remove: () => {} }),
}));
jest.mock('@tanstack/query-async-storage-persister', () => ({
  createAsyncStoragePersister: () => ({}),
}));
import { shouldPersistQuery } from './queryPersister';

const q = (key: unknown[], status = 'success') => ({ queryKey: key, state: { status } });

describe('what goes into the plain-storage query cache', () => {
  it('keeps public train data for offline use', () => {
    expect(shouldPersistQuery(q(['trains', '12951']))).toBe(true);
  });
  it('never stores bookings, the signed-in profile or admin data', () => {
    expect(shouldPersistQuery(q(['booking', 'run', 1]))).toBe(false);
    expect(shouldPersistQuery(q(['auth', 'me']))).toBe(false);
    expect(shouldPersistQuery(q(['admin', 'health', 'ops']))).toBe(false);
  });
  it('only successful results, as before', () => {
    expect(shouldPersistQuery(q(['trains', '1'], 'error'))).toBe(false);
  });
});
