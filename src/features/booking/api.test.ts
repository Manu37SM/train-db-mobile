import { AxiosError, AxiosHeaders } from 'axios';

const mockRequest = jest.fn();
const mockToken = jest.fn();
jest.mock('@/api/client', () => ({ getValidAccessToken: () => mockToken() }));
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  // Called lazily: the module under test runs axios.create() while it is imported.
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      create: () => ({
        request: (...a: unknown[]) => mockRequest(...a),
        interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
      }),
    },
  };
});

import { createBooking, findRun, paySimulated, toBookingFailure } from './api';
import { AuthFailure, getApiErrorCode, getApiErrorMessage } from '@/lib/apiError';

function httpError(status: number, data: unknown) {
  return new AxiosError('fail', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}

describe('RailOps booking calls (app)', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockToken.mockReset();
  });

  it('run lookup is public: no token asked for or sent', async () => {
    mockRequest.mockResolvedValue({ data: { runId: 1 } });
    await findRun('12951', '2026-11-20');
    expect(mockToken).not.toHaveBeenCalled();
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/api/v1/runs?trainNo=12951&date=2026-11-20',
    });
    expect(mockRequest.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('booking sends the RailOps token and the idempotency key, never an amount', async () => {
    mockToken.mockResolvedValue('ro-access');
    mockRequest.mockResolvedValue({ data: { pnr: '4123456789' } });
    await createBooking(
      {
        trainRunId: 1,
        fromStopSeq: 0,
        toStopSeq: 4,
        travelClass: '3A',
        quota: 'GN',
        passengers: [{ name: 'Asha', age: 30, gender: 'F' }],
        onlyIfConfirmed: false,
        contactPhone: '9820012345',
      },
      'rl-key-1234567890',
    );
    const req = mockRequest.mock.calls[0][0];
    expect(req.headers).toEqual({
      Authorization: 'Bearer ro-access',
      'Idempotency-Key': 'rl-key-1234567890',
    });
    expect(JSON.stringify(req.data)).not.toMatch(/fare|amount/i);
  });

  it('signed out means no call; RailOps errors keep their code and get a plain message', async () => {
    mockToken.mockResolvedValue(null);
    await expect(paySimulated('4123456789', 'SUCCESS')).rejects.toMatchObject({ status: 401 });
    expect(mockRequest).not.toHaveBeenCalled();

    mockToken.mockResolvedValue('t');
    mockRequest.mockRejectedValue(httpError(404, { code: 'RES_SIMULATED_PAYMENTS_OFF' }));
    const off = await paySimulated('4123456789', 'SUCCESS').catch((e) => e);
    expect(getApiErrorCode(off)).toBe('RES_SIMULATED_PAYMENTS_OFF');
  });

  it('messages come from stable codes, never from RailOps log text', () => {
    expect(
      getApiErrorMessage(
        toBookingFailure(httpError(409, { code: 'RES_REGRET', detail: 'pool 3A/GN' })),
        'f',
      ),
    ).toMatch(/No seats/);
    expect(
      getApiErrorMessage(
        toBookingFailure(
          httpError(422, { code: 'RES_INVALID_JOURNEY', detail: 'from must be before to' }),
        ),
        'f',
      ),
    ).toBe('From must be before to.');
    expect(
      getApiErrorMessage(toBookingFailure(httpError(500, { detail: 'NullPointerException' })), 'f'),
    ).not.toContain('Null');
    expect(toBookingFailure(new Error('offline'))).toBeInstanceOf(AuthFailure);
  });
});
