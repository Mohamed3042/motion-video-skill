// The four camera tracks (NLE lanes) carrying the hidden word. Shared by the Sync world and the Ingest exit pose.
import React from 'react';
import {C, FONT, MONO, RADIUS} from '../../brand';
import {clamp, mix, mixHex, rgba} from './kit';
import {LaneArt} from './LaneArt';
import {CLIP_END, LANE, LANE_W, clipStart, laneY} from './word';

export const MUTED = '#8e998f'; // lane colour before a track locks

export const TRACKS = [
  {name: 'C1', file: 'C1_0012.MP4'},
  {name: 'C2', file: 'C2_0007.MP4'},
  {name: 'C3', file: 'C3_0031.MP4'},
  {name: 'ZOOM', file: 'ZOOM0004.WAV'},
];

export type LaneState = {
  offset: number; // px
  color: string; // bar colour
  lock: number; // 0..1 lane border / header highlight
  flash?: number; // 0..1 scan flash right after lock
};

type Props = {
  lanes: LaneState[];
  headers?: number; // header column opacity
  wordBoost?: number; // 0..1 after the reveal: word strokes brighten, the floor dims
  zoom?: number; // horizontal scale of the lane content around the lane's left edge
  contentOpacity?: number;
  laneOpacity?: number;
  status?: (string | null)[]; // per-lane header status line
  dx?: number; // whole stack horizontal shift
  reveal?: number[]; // per-lane 0..1: lane body wiped in from the left (Ingest exit)
};

export const Lanes: React.FC<Props> = ({lanes, headers = 1, wordBoost = 0, zoom = 1, contentOpacity = 1, laneOpacity = 1, status, dx = 0, reveal}) => (
  <>
    {lanes.map((s, i) => {
      const y = laneY(i);
      return (
        <React.Fragment key={i}>
          {/* header */}
          <div style={{position: 'absolute', left: 120 + dx, top: y, width: 156, height: LANE.h, opacity: headers, display: 'flex', alignItems: 'center'}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: RADIUS.control,
                background: C.panel,
                border: `1px solid ${s.lock > 0 ? mixHex(C.line, s.color, 0.55 * s.lock) : C.line}`,
              }}
            />
            <div style={{position: 'absolute', left: 16, top: 18, width: 10, height: 10, borderRadius: 2, background: s.color}} />
            <div style={{position: 'absolute', left: 36, top: 11, fontFamily: FONT, fontWeight: 700, fontSize: 22, color: C.text}}>{TRACKS[i].name}</div>
            <div style={{position: 'absolute', left: 16, top: 44, fontFamily: MONO, fontWeight: 500, fontSize: 12, color: C.muted}}>{TRACKS[i].file}</div>
            {status?.[i] ? (
              <div style={{position: 'absolute', left: 16, top: 68, fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', color: s.color, opacity: clamp(s.lock * 1.5)}}>{status[i]}</div>
            ) : null}
          </div>
          {/* lane */}
          <div
            style={{
              position: 'absolute',
              left: LANE.x0 + dx,
              top: y,
              width: LANE_W,
              height: LANE.h,
              borderRadius: RADIUS.control,
              background: rgba('#151917', mix(1, 0.25, wordBoost)),
              border: `1px solid ${rgba(mixHex(C.line, s.color, 0.6 * s.lock), mix(1, 0.3, wordBoost))}`,
              overflow: 'hidden',
              opacity: laneOpacity,
              clipPath: reveal ? `inset(0 ${(1 - clamp(reveal[i])) * 100}% 0 0)` : undefined,
            }}
          >
            <div style={{position: 'absolute', left: 0, top: 0, width: LANE_W, height: LANE.h, transform: `scaleX(${zoom})`, transformOrigin: '0 50%', opacity: contentOpacity}}>
              <div style={{position: 'absolute', left: 0, top: 0, width: LANE_W, height: LANE.h, transform: `translateX(${s.offset}px)`}}>
                {/* clip body */}
                <div
                  style={{
                    position: 'absolute',
                    left: clipStart(i),
                    top: 4,
                    width: CLIP_END - clipStart(i),
                    height: LANE.h - 8,
                    borderRadius: 5,
                    background: rgba(s.color, 0.07 * (1 - wordBoost)),
                    borderLeft: `2px solid ${rgba(s.color, 0.55)}`,
                  }}
                >
                  {/* L / R channel divider */}
                  <div style={{position: 'absolute', left: 0, right: 0, top: LANE.h / 2 - 4, height: 1, background: rgba(s.color, 0.12 * (1 - wordBoost))}} />
                </div>
                <LaneArt lane={i} color={s.color} boost={wordBoost} />
              </div>
            </div>
            {s.flash ? (
              <div
                style={{
                  position: 'absolute',
                  left: mix(-300, LANE_W, s.flash),
                  top: 0,
                  width: 300,
                  height: LANE.h,
                  background: `linear-gradient(90deg, ${rgba(s.color, 0)} 0%, ${rgba(s.color, 0.28)} 85%, ${rgba('#fff4d6', 0.55)} 100%)`,
                  opacity: 1 - s.flash,
                }}
              />
            ) : null}
          </div>
        </React.Fragment>
      );
    })}
  </>
);
