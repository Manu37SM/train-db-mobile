export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshToken: string;
  username: string;
  email: string;
}
export interface CurrentUserResponse {
  username: string;
  email: string;
  createdAt: string | null;
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}
export interface TrainSearchResponse {
  trainNumber: string;
  trainName: string;
}
export interface RouteStopResponse {
  sequenceNo: number;
  stationCode: string;
  stationName: string;
  arrivalTime: string | null;
  departureTime: string | null;
  distance: number | null;
  distanceFromPrevious: number | null;
  haltMinutes: number | null;
  journeyDay: number;
  origin: boolean;
  destination: boolean;
}
export interface TrainDetailsResponse {
  trainNumber: string;
  trainName: string;
  totalStops: number;
  journeyDistance: number | null;
  journeyMinutes: number | null;
  averageSpeed: number | null;
  route: RouteStopResponse[];
  sourceStationName: string;
  destinationStationName: string;
}
export interface TrainIntelligenceResponse {
  trainNumber: string;
  trainName: string;
  routeComplexityScore: number;
  trainUniquenessScore: number;
  expressnessScoreKmPerHalt: number;
  nightTravelPercent: number;
  dayTravelPercent: number;
  longestNonStopSegmentKm: number | null;
  longestNonStopSegmentFromStation: string | null;
  longestNonStopSegmentToStation: string | null;
  averageHaltMinutes: number;
  journeyEfficiencyIndex: number;
  isCircularRoute: boolean;
  possiblySkippedStations: string[];
}
export interface RouteComparisonResponse {
  trainNumberA: string;
  trainNameA: string;
  totalStationsA: number;
  trainNumberB: string;
  trainNameB: string;
  totalStationsB: number;
  sharedStationCount: number;
  routeSimilarityPercent: number;
  longestCommonSegment: string[];
  divergencePoint: string | null;
  convergencePoint: string | null;
  isReverseRoute: boolean;
  isSameRoute: boolean;
}
export interface StationSearchResponse {
  stationCode: string;
  stationName: string;
}
export interface StationTrainResponse {
  trainNumber: string;
  trainName: string;
  arrivalTime: string | null;
  departureTime: string | null;
  distance: number | null;
  sequenceNo: number | null;
  origin: boolean;
  destination: boolean;
}
export interface StationResponse {
  stationCode: string;
  stationName: string;
  totalTrains: number;
  trains: StationTrainResponse[];
}
export interface StationIntelligenceResponse {
  stationCode: string;
  stationName: string;
  networkRank: number | null;
  totalStationsInNetwork: number;
  connectivityScore: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  degree: number;
  totalStops: number;
  originCount: number;
  destinationCount: number;
  transitCount: number;
  originPercent: number;
  destinationPercent: number;
  transitPercent: number;
  averageHaltMinutes: number;
  averageTrainSpeedKmh: number | null;
  stationImportanceScore: number;
  departureCountByHour: number[];
  arrivalCountByHour: number[];
}
export interface JourneyTrainResponse {
  trainNumber: string;
  trainName: string;
  departureTime: string | null;
  arrivalTime: string | null;
  duration: string;
  distance: number | null;
  movingMinutes: number;
  haltedMinutes: number;
  numHalts: number;
  longestHaltMinutes: number | null;
  averageMovingSpeedKmh: number | null;
  nightTravelPercent: number | null;
  dayTravelPercent: number | null;
}
export interface JourneySearchResponse {
  from: string;
  to: string;
  totalTrains: number;
  trains: JourneyTrainResponse[];
}
export interface SmartSearchResponse {
  recognized: boolean;
  interpretedAs: string | null;
  matchCount: number;
  trains: TrainSearchResponse[];
}
export interface RouteDistanceProjection {
  trainNumber: string;
  trainName: string;
  distanceKm: number | null;
}
export interface TrainSpeedProjection {
  trainNumber: string;
  trainName: string;
  averageSpeedKmh: number;
  distanceKm: number;
  durationMinutes: number;
}
export interface StationTrafficProjection {
  stationCode: string;
  stationName: string;
  trainCount: number;
}
export interface StatsResponse {
  totalTrains: number;
  totalStations: number;
  longestRoute: RouteDistanceProjection | null;
  shortestRoute: RouteDistanceProjection | null;
  busiestStation: StationTrafficProjection | null;
  busiestStations: StationTrafficProjection[];
  fastestTrains: TrainSpeedProjection[];
  slowestTrains: TrainSpeedProjection[];
}
export interface HaltCountEntry {
  trainNumber: string;
  trainName: string;
  haltCount: number;
}
export interface HaltDurationEntry {
  trainNumber: string;
  trainName: string;
  stationCode: string;
  stationName: string;
  minutes: number;
}
export interface StationCountEntry {
  stationCode: string;
  stationName: string;
  count: number;
}
export interface RankingsResponse {
  mostHaltsTrains: HaltCountEntry[];
  fewestHaltsTrains: HaltCountEntry[];
  longestHalts: HaltDurationEntry[];
  shortestHalts: HaltDurationEntry[];
  mostPopularOriginStations: StationCountEntry[];
  mostConnectedStations: StationCountEntry[];
}
export interface StationNameEntry {
  stationCode: string;
  stationName: string;
  length: number;
}
export interface WordFrequency {
  word: string;
  count: number;
}
export interface TrainStopEntry {
  trainNumber: string;
  trainName: string;
  uniqueStationCount: number;
}
export interface FunStatsResponse {
  longestStationName: StationNameEntry | null;
  shortestStationName: StationNameEntry | null;
  mostCommonStationNameWord: WordFrequency | null;
  stationCountByFirstLetter: Record<string, number>;
  trainWithMostUniqueStations: TrainStopEntry | null;
  palindromeStationCodes: string[];
}
export interface SuperExpressEntry {
  trainNumber: string;
  trainName: string;
  kmPerHalt: number;
}
export interface RareRouteEntry {
  trainNumber: string;
  trainName: string;
  averageTrainsPerHop: number;
}
export interface HiddenGemEntry {
  trainNumber: string;
  trainName: string;
  distanceKm: number;
  averageSpeedKmh: number;
}
export interface AchievementsResponse {
  longestRoutes: RouteDistanceProjection[];
  fastestTrains: TrainSpeedProjection[];
  megaRoutes: RouteDistanceProjection[];
  superExpressRankings: SuperExpressEntry[];
  rareRoutes: RareRouteEntry[];
  hiddenGems: HiddenGemEntry[];
}
export interface CentralStation {
  stationCode: string;
  stationName: string;
  betweennessCentrality: number;
  closenessCentrality: number;
  degree: number;
}
export interface NetworkStatsResponse {
  totalStations: number;
  totalTrains: number;
  totalEdges: number;
  routeDensity: number;
  connectedComponentCount: number;
  largestComponentSize: number;
  networkDiameter: number;
  mostCentralStations: CentralStation[];
}
export interface AdminStatsResponse {
  totalTrains: number;
  totalStations: number;
  totalScheduleRows: number;
}
export interface ImportResult {
  success: boolean;
  rowsImported: number;
  rowsFailed: number;
  message: string;
}
export interface DatasetHealthResponse {
  totalIssues: number;
  duplicateScheduleRowCount: number;
  duplicateScheduleRowSamples: string[];
  missingTimingCount: number;
  missingTimingSamples: string[];
  distanceInconsistencyCount: number;
  distanceInconsistencySamples: string[];
  impossibleSpeedCount: number;
  impossibleSpeedSamples: string[];
  haltAnomalyCount: number;
  haltAnomalySamples: string[];
  orphanStationCount: number;
  orphanStationSamples: string[];
  invalidRouteCount: number;
  invalidRouteSamples: string[];
}
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
}
