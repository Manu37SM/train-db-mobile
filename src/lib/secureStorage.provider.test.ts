const mockStore: { password?: string } = {};
const mockReset = jest.fn(async () => {
  delete mockStore.password;
  return true;
});
jest.mock('react-native-keychain', () => ({
  getGenericPassword: async () =>
    mockStore.password ? { username: 'u', password: mockStore.password } : false,
  resetGenericPassword: () => mockReset(),
}));
jest.mock('@/config/login', () => ({ LOGIN_PROVIDER: 'railops' }));

import { loadSession, toStoredSession } from './secureStorage';

describe('stored sessions after a login switch (Phase 4D)', () => {
  it('drops tokens issued by the other login instead of sending them to the wrong service', async () => {
    mockStore.password = JSON.stringify({
      token: 't',
      refreshToken: 'raillens-rt',
      username: 'u',
      email: 'e',
    });
    expect(await loadSession()).toBeNull();
    expect(mockReset).toHaveBeenCalled();
  });

  it('keeps sessions from the current login, and tags new ones with it', async () => {
    const saved = toStoredSession({
      token: 't',
      tokenType: 'Bearer',
      expiresInSeconds: 600,
      refreshToken: 'r',
      username: 'u',
      email: 'e',
    });
    expect(saved.provider).toBe('railops');
    mockStore.password = JSON.stringify(saved);
    expect(await loadSession()).toMatchObject({ refreshToken: 'r' });
  });
});
