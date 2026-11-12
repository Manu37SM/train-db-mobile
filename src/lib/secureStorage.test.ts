jest.mock('react-native-keychain', () => ({}));
import { toStoredSession } from './secureStorage';
describe('toStoredSession', () => {
  const base = {
    token: 't',
    tokenType: 'Bearer',
    expiresInSeconds: 900,
    refreshToken: 'r',
    username: 'ops',
    email: 'ops@example.com',
  };
  it('keeps ADMIN and treats anything else (or an older server) as USER', () => {
    expect(toStoredSession({ ...base, role: 'ADMIN' }).role).toBe('ADMIN');
    expect(toStoredSession(base).role).toBe('USER');
  });
  it('never stores an enrolment token', () => {
    const stored = toStoredSession({
      ...base,
      enrolmentToken: 'secret-enrol',
      mfaEnrolmentRequired: true,
    });
    expect(JSON.stringify(stored)).not.toContain('secret-enrol');
  });
});
