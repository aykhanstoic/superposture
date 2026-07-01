export type PostureStatus = "excellent" | "good" | "fair" | "poor";

export type IssueType =
  | "forward_head"
  | "slouching"
  | "uneven_shoulders"
  | "leaning_left"
  | "leaning_right"
  | "excessive_neck_angle";

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
  leftEar: Point2D;
  rightEar: Point2D;
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  leftElbow: Point2D;
  rightElbow: Point2D;
  leftHip: Point2D;
  rightHip: Point2D;
}

export type Sensitivity = "low" | "medium" | "high";

export interface AppSettings {
  reminderIntervalMinutes: number;
  sensitivity: Sensitivity;
  cameraId: string;
  launchOnStartup: boolean;
  darkMode: boolean;
  notificationSounds: boolean;
  paused: boolean;
  showCameraPreview: boolean;
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

export const ISSUE_LABELS: Record<IssueType, string> = {
  forward_head: "Forward Head",
  slouching: "Rounded Shoulders",
  uneven_shoulders: "Uneven Shoulders",
  leaning_left: "Leaning Left",
  leaning_right: "Leaning Right",
  excessive_neck_angle: "Excessive Neck Angle",
};

export const DEFAULT_SETTINGS: AppSettings = {
  reminderIntervalMinutes: 3,
  sensitivity: "medium",
  cameraId: "",
  launchOnStartup: false,
  darkMode: true,
  notificationSounds: true,
  paused: false,
  showCameraPreview: true,
};
