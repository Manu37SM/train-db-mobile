// No react-native import here, so tests and plain modules can read it.
/**
 * Who handles sign-in (single login, Phase 4D). Built into the APK, so changing it means building a new one.
 * - 'raillens' (default): RailLens' own accounts, exactly as before.
 * - 'railops': the RailOps login shared with the website and the RailOps app. Sign-in by email; new accounts give a
 *   phone number; staff admins type their one-time code with the password.
 * Switch it only after the website has switched (DEPLOYMENT.md Section 9b). Rollback: set 'raillens', new APK.
 */
export type LoginProvider = 'raillens' | 'railops';
export const LOGIN_PROVIDER = 'raillens' as LoginProvider;
/** The RailOps gateway. Only used when LOGIN_PROVIDER is 'railops'. */
export const RAILOPS_BASE_URL = 'https://railops-gateway.onrender.com';

/**
 * Booking (Phase 5B): book RailOps tickets in the app. Needs LOGIN_PROVIDER = 'railops' too, because RailOps only
 * accepts its own sign-in. Built into the APK. Turn on after the website's booking works (DEPLOYMENT.md Section 9c).
 */
export const BOOKING_ENABLED = false as boolean;
/**
 * Only for a real payment gateway later: https hosts its checkout may be on. Empty for the demo, which uses
 * RailOps' simulated payment and never opens a checkout page.
 */
export const RAILOPS_PAYMENT_HOSTS: readonly string[] = [];
