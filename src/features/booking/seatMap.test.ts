const mockRequest = jest.fn();
jest.mock('@/api/client', () => ({ getValidAccessToken: jest.fn() }));
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      create: () => ({ request: (...a: unknown[]) => mockRequest(...a) }),
    },
  };
});
jest.mock('@/config/login', () => ({ RAILOPS_BASE_URL: 'https://railops.example' }));
import { getSeatMap } from './api';
import { preferenceOptions } from './format';

describe('seat map (app, Phase 6)', () => {
  it('is public: no token, class and journey in the query', async () => {
    mockRequest.mockResolvedValue({ data: { coaches: [] } });
    await getSeatMap(7, '2S', 1, 4);
    const req = mockRequest.mock.calls[0][0];
    expect(req.url).toBe('/api/v1/runs/7/seat-map?class=2S&from=1&to=4');
    expect(req.headers.Authorization).toBeUndefined();
  });

  it('preference choices match the website', () => {
    expect(preferenceOptions('CC')).toEqual(['WS', 'MS', 'AS']);
    expect(preferenceOptions('EC')).toEqual(['WS', 'AS']);
    expect(preferenceOptions('2A')).toEqual(['LB', 'UB', 'SU']);
    expect(preferenceOptions('SL')).not.toContain('SL'); // side lowers are kept for RAC
    expect(preferenceOptions('3A')).toContain('MB');
  });
});
