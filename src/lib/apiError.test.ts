import { AxiosError, AxiosHeaders } from 'axios';
import { getApiErrorCode, getApiErrorMessage } from './apiError';
function axiosError(status: number, data: unknown) {
  return new AxiosError('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}
describe('apiError', () => {
  it('reads the server message and machine-readable code', () => {
    const err = axiosError(401, {
      status: 401,
      error: 'One-time code required',
      code: 'MFA_REQUIRED',
    });
    expect(getApiErrorMessage(err, 'fallback')).toBe('One-time code required');
    expect(getApiErrorCode(err)).toBe('MFA_REQUIRED');
  });
  it('has no code for ordinary errors or non-HTTP failures', () => {
    expect(getApiErrorCode(axiosError(404, { status: 404, error: 'Not found' }))).toBeUndefined();
    expect(getApiErrorCode(new Error('offline'))).toBeUndefined();
  });
});
