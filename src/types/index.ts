export type PostureStatus = "excellent" | "good" | "fair" | "poor";

export type IssueType =
  | "forward_head"
  | "slouching"
  | "uneven_shoulders"
  | "leaning_left"
  | "leaning_right";

export type IssueSeverity = "low" | "medium" | "high";

export interface PostureIssue {
  type: IssueType;
  label: string;
  severity: IssueSeverity;
  confidence: number;
}

export interface PostureResult {
  score: number;
  status: PostureStatus;
  issues: PostureIssue[];
  timestamp: number;
}

export interface Point2D {
  x: number;
  y: number;
  visibility?: number;
}

export interface PoseLandmarks {
  nose: Point2D;
  leftEye: Point2D;
  rightEye: Point2D;
  leftEar: Point2D;
  rightEar: Point2D;
  leftShoulder: Point2D;
  rightShoulder: Point2D;
}

export type Sensitivity = "low" | "medium" | "high";

export interface AppSettings {
  reminderIntervalMinutes: number;
  sensitivity: Sensitivity;
  cameraId: string;
  launchOnStartup: boolean;
  notificationSounds: boolean;
  paused: boolean;
  showCameraPreview: boolean;
  introDismissed: boolean;
}

export interface DailyStats {
  date: string;
  avg_score: number;
  monitoring_seconds: number;
  reminder_count: number;
  good_streak_seconds: number;
}

export interface SessionRecord {
  id: number;
  start_time: string;
  end_time: string | null;
  avg_score: number;
  duration_seconds: number;
  reminder_count: number;
}

export interface ScoreSample {
  sessionId: number;
  timestamp: string;
  score: number;
}

export interface DashboardData {
  todayMonitoringSeconds: number;
  todayAvgScore: number;
  longestGoodStreakSeconds: number;
  todayReminderCount: number;
  weeklyTrend: { date: string; avgScore: number }[];
  monthlyTrend: { date: string; avgScore: number }[];
}

export const CAMERA_OFF_VALUE = "__off__";

export const ISSUE_LABELS: Record<IssueType, string> = {
  forward_head: "Forward head",
  slouching: "Slouching",
  uneven_shoulders: "Uneven shoulders",
  leaning_left: "Leaning left",
  leaning_right: "Leaning right",
};

/** One actionable correction per issue — the UI coaches, it doesn't judge. */
export const ISSUE_TIPS: Record<IssueType, string> = {
  forward_head:
    "Your head is drifting toward the screen — sit back and imagine a string lifting the crown of your head.",
  slouching: "Lift your chest and let your shoulders settle down and back.",
  uneven_shoulders:
    "One shoulder is riding higher — relax your arms and level them out.",
  leaning_left: "You're tilting left — re-center yourself over your chair.",
  leaning_right: "You're tilting right — re-center yourself over your chair.",
};

export const DEFAULT_SETTINGS: AppSettings = {
  reminderIntervalMinutes: 3,
  sensitivity: "medium",
  cameraId: "",
  launchOnStartup: false,
  notificationSounds: true,
  paused: false,
  // On first run the preview is the product's proof-of-life: new users must
  // SEE it tracking them. They can hide it from the preview itself.
  showCameraPreview: true,
  introDismissed: false,
};
