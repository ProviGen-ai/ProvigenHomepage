'use client';

import ShaderGradient from '@/components/site/ShaderGradient';
import { useStage } from './ProblemScroll';
import { BEATS, PATH_FROM, PATH_TO, lerpStops } from './timeline';

/*
 * The living dawn gradient behind the landscape. Pinned: colour rises out of
 * the paper while the notes are written, peaks on the turn and over the ridge
 * while the path crosses it, then settles toward B as the solution lands.
 * Flow: a fixed field, faded in from the top by CSS.
 */
const TURN = BEATS[3][0];
const INTENSITY = [
  [0, 0.05],
  [0.28, 0.22],
  [TURN - 0.05, 0.4],
  [TURN + 0.04, 1],
  [PATH_FROM + 0.05, 1],
  [PATH_TO, 0.56],
  [1, 0.66],
] as const;
const FOCUS_X = [
  [0, 0.28],
  [TURN - 0.05, 0.34],
  [TURN + 0.06, 0.5],
  [PATH_TO - 0.02, 0.68],
  [1, 0.72],
] as const;
const FOCUS_Y = [
  [0, 0.2],
  [TURN - 0.05, 0.28],
  [TURN + 0.06, 0.5],
  [PATH_TO - 0.02, 0.3],
  [1, 0.28],
] as const;

export default function ProblemShader() {
  const { progress, mode, paused } = useStage();
  const pin = mode === 'pin';
  const intensity = pin ? lerpStops(progress, INTENSITY) : 0.66;
  const focus: [number, number] = pin
    ? [lerpStops(progress, FOCUS_X), lerpStops(progress, FOCUS_Y)]
    : [0.66, 0.2];
  // The stage's Pause holds the light too; scroll still sets its intensity and focus.
  return (
    <ShaderGradient
      palette="dawn"
      intensity={intensity}
      focus={focus}
      hold={paused}
      className="p-shader"
    />
  );
}
