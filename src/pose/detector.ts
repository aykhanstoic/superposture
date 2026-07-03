import type { PoseLandmarks, Point2D } from "@/types";

function toVideoCoords(point: Point2D, videoWidth: number, videoHeight: number) {
  return { x: point.x * videoWidth, y: point.y * videoHeight };
}

function ensureCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): void {
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawTwoLineOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmarks,
  videoWidth: number,
  videoHeight: number,
): void {
  const ls = toVideoCoords(landmarks.leftShoulder, videoWidth, videoHeight);
  const rs = toVideoCoords(landmarks.rightShoulder, videoWidth, videoHeight);
  const le = toVideoCoords(landmarks.leftEar, videoWidth, videoHeight);
  const re = toVideoCoords(landmarks.rightEar, videoWidth, videoHeight);
  const leye = toVideoCoords(landmarks.leftEye, videoWidth, videoHeight);
  const reye = toVideoCoords(landmarks.rightEye, videoWidth, videoHeight);
  const nose = toVideoCoords(landmarks.nose, videoWidth, videoHeight);

  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Shoulder line
  ctx.beginPath();
  ctx.moveTo(ls.x, ls.y);
  ctx.lineTo(rs.x, rs.y);
  ctx.stroke();

  // Face polyline: leftEar → leftEye → nose → rightEye → rightEar
  ctx.beginPath();
  ctx.moveTo(le.x, le.y);
  ctx.lineTo(leye.x, leye.y);
  ctx.lineTo(nose.x, nose.y);
  ctx.lineTo(reye.x, reye.y);
  ctx.lineTo(re.x, re.y);
  ctx.stroke();

  ctx.fillStyle = "#4ade80";
  for (const point of [ls, rs, le, leye, nose, reye, re]) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPreview(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: PoseLandmarks | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  ensureCanvasSize(canvas, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(video, 0, 0, w, h);

  if (landmarks) {
    drawTwoLineOverlay(ctx, landmarks, w, h);
  }
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
