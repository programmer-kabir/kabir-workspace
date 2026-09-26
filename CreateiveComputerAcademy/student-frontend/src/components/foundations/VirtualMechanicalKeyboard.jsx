import React from 'react';
import { FINGER_ZONES, KEY_TO_FINGER } from '../../data/typingCurriculum';

const KEYBOARD_ROWS = [
  // Number Row
  [
    { key: '`', shift: '~', width: 'w-10 sm:w-11', finger: 'left_pinky' },
    { key: '1', shift: '!', width: 'w-10 sm:w-11', finger: 'left_pinky' },
    { key: '2', shift: '@', width: 'w-10 sm:w-11', finger: 'left_ring' },
    { key: '3', shift: '#', width: 'w-10 sm:w-11', finger: 'left_middle' },
    { key: '4', shift: '$', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: '5', shift: '%', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: '6', shift: '^', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: '7', shift: '&', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: '8', shift: '*', width: 'w-10 sm:w-11', finger: 'right_middle' },
    { key: '9', shift: '(', width: 'w-10 sm:w-11', finger: 'right_ring' },
    { key: '0', shift: ')', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: '-', shift: '_', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: '=', shift: '+', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: 'Backspace', width: 'w-14 sm:w-16 flex-1', finger: 'right_pinky', isSpecial: true }
  ],
  // Top Row
  [
    { key: 'Tab', width: 'w-12 sm:w-14', finger: 'left_pinky', isSpecial: true },
    { key: 'q', shift: 'Q', width: 'w-10 sm:w-11', finger: 'left_pinky' },
    { key: 'w', shift: 'W', width: 'w-10 sm:w-11', finger: 'left_ring' },
    { key: 'e', shift: 'E', width: 'w-10 sm:w-11', finger: 'left_middle' },
    { key: 'r', shift: 'R', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: 't', shift: 'T', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: 'y', shift: 'Y', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: 'u', shift: 'U', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: 'i', shift: 'I', width: 'w-10 sm:w-11', finger: 'right_middle' },
    { key: 'o', shift: 'O', width: 'w-10 sm:w-11', finger: 'right_ring' },
    { key: 'p', shift: 'P', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: '[', shift: '{', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: ']', shift: '}', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: '\\', shift: '|', width: 'w-10 sm:w-12', finger: 'right_pinky' }
  ],
  // Home Row
  [
    { key: 'Caps', width: 'w-14 sm:w-16', finger: 'left_pinky', isSpecial: true },
    { key: 'a', shift: 'A', width: 'w-10 sm:w-11', finger: 'left_pinky', isHome: true },
    { key: 's', shift: 'S', width: 'w-10 sm:w-11', finger: 'left_ring', isHome: true },
    { key: 'd', shift: 'D', width: 'w-10 sm:w-11', finger: 'left_middle', isHome: true },
    { key: 'f', shift: 'F', width: 'w-10 sm:w-11', finger: 'left_index', isHome: true, hasBump: true },
    { key: 'g', shift: 'G', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: 'h', shift: 'H', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: 'j', shift: 'J', width: 'w-10 sm:w-11', finger: 'right_index', isHome: true, hasBump: true },
    { key: 'k', shift: 'K', width: 'w-10 sm:w-11', finger: 'right_middle', isHome: true },
    { key: 'l', shift: 'L', width: 'w-10 sm:w-11', finger: 'right_ring', isHome: true },
    { key: ';', shift: ':', width: 'w-10 sm:w-11', finger: 'right_pinky', isHome: true },
    { key: "'", shift: '"', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: 'Enter', width: 'w-16 sm:w-20 flex-1', finger: 'right_pinky', isSpecial: true }
  ],
  // Bottom Row
  [
    { key: 'Shift_L', label: 'Shift', width: 'w-16 sm:w-20', finger: 'left_pinky', isSpecial: true },
    { key: 'z', shift: 'Z', width: 'w-10 sm:w-11', finger: 'left_pinky' },
    { key: 'x', shift: 'X', width: 'w-10 sm:w-11', finger: 'left_ring' },
    { key: 'c', shift: 'C', width: 'w-10 sm:w-11', finger: 'left_middle' },
    { key: 'v', shift: 'V', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: 'b', shift: 'B', width: 'w-10 sm:w-11', finger: 'left_index' },
    { key: 'n', shift: 'N', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: 'm', shift: 'M', width: 'w-10 sm:w-11', finger: 'right_index' },
    { key: ',', shift: '<', width: 'w-10 sm:w-11', finger: 'right_middle' },
    { key: '.', shift: '>', width: 'w-10 sm:w-11', finger: 'right_ring' },
    { key: '/', shift: '?', width: 'w-10 sm:w-11', finger: 'right_pinky' },
    { key: 'Shift_R', label: 'Shift', width: 'w-16 sm:w-20 flex-1', finger: 'right_pinky', isSpecial: true }
  ],
  // Space Row
  [
    { key: 'Ctrl', width: 'w-12 sm:w-14', finger: 'left_pinky', isSpecial: true },
    { key: 'Win', width: 'w-10 sm:w-11', finger: 'left_pinky', isSpecial: true },
    { key: 'Alt', width: 'w-10 sm:w-12', finger: 'left_pinky', isSpecial: true },
    { key: ' ', label: 'SPACEBAR', width: 'w-48 sm:w-64 md:w-80 flex-1', finger: 'thumbs', isSpace: true },
    { key: 'Alt', width: 'w-10 sm:w-12', finger: 'right_pinky', isSpecial: true },
    { key: 'Fn', width: 'w-10 sm:w-11', finger: 'right_pinky', isSpecial: true },
    { key: 'Ctrl', width: 'w-12 sm:w-14', finger: 'right_pinky', isSpecial: true }
  ]
];

const VirtualMechanicalKeyboard = ({ activeChar = 'f', pressedKey = '', isError = false }) => {
  const targetChar = activeChar === ' ' ? ' ' : activeChar;
  const isTargetShifted = targetChar !== ' ' && (
    (targetChar >= 'A' && targetChar <= 'Z') ||
    ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', ':', '"', '<', '>', '?'].includes(targetChar)
  );

  // Check which shift key to use (opposite hand)
  const currentZone = KEY_TO_FINGER[targetChar];
  const requiredShiftKey = currentZone?.hand === 'right' ? 'Shift_L' : 'Shift_R';

  const isKeyActive = (keyObj) => {
    if (keyObj.key === ' ' && targetChar === ' ') return true;
    if (isTargetShifted && (keyObj.key === requiredShiftKey)) return true;
    if (keyObj.key?.toLowerCase() === targetChar.toLowerCase()) return true;
    if (keyObj.shift === targetChar) return true;
    return false;
  };

  const isKeyPressed = (keyObj) => {
    if (keyObj.key === ' ' && pressedKey === ' ') return true;
    if (keyObj.key?.toLowerCase() === pressedKey.toLowerCase()) return true;
    if (keyObj.shift === pressedKey) return true;
    return false;
  };

  return (
    <div className="w-full p-2.5 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white select-none overflow-x-auto custom-scrollbar">
      <div className="min-w-[620px] max-w-4xl mx-auto flex flex-col gap-1.5 sm:gap-2">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 sm:gap-1.5 justify-center">
            {row.map((item, kIdx) => {
              const active = isKeyActive(item);
              const pressed = isKeyPressed(item);
              const fingerZone = FINGER_ZONES[item.finger] || FINGER_ZONES.thumbs;
              const fingerColor = fingerZone.color;

              let keyStyle = {};
              if (active) {
                keyStyle = {
                  backgroundColor: isError ? '#ef4444' : fingerColor,
                  color: '#ffffff',
                  borderColor: isError ? '#dc2626' : fingerColor,
                  boxShadow: `0 0 16px ${isError ? '#ef4444' : fingerColor}90`,
                  transform: 'translateY(2px)'
                };
              }

              return (
                <div
                  key={kIdx}
                  style={keyStyle}
                  className={`
                    ${item.width} h-9 sm:h-11 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-sans transition-all duration-150 relative cursor-default
                    ${active ? 'font-black scale-98 ring-2 ring-white/60 z-10' : ''}
                    ${pressed ? 'translate-y-1 shadow-inner' : 'shadow-md'}
                    ${!active ? 'bg-slate-800/90 text-slate-200 border-b-3 border-slate-950/80 hover:bg-slate-700/80' : ''}
                  `}
                >
                  {/* Shift Label on Keycap */}
                  {item.shift && (
                    <span className={`text-[8px] sm:text-[9px] font-bold leading-none ${active ? 'text-white' : 'text-slate-400'}`}>
                      {item.shift}
                    </span>
                  )}

                  {/* Main Key Label */}
                  <span className={`text-xs sm:text-sm font-black leading-tight ${item.isSpecial ? 'text-[10px] uppercase font-bold text-slate-400' : ''}`}>
                    {item.label || item.key.toUpperCase()}
                  </span>

                  {/* Tactile Bump Dot for Home Row (F and J) */}
                  {item.hasBump && (
                    <div className="w-2.5 sm:w-3 h-0.5 rounded-full bg-white/70 absolute bottom-1 shadow-xs" />
                  )}

                  {/* Finger Zone Bottom Indicator Dot */}
                  {!active && !item.isSpecial && (
                    <div
                      className="w-1.5 h-1.5 rounded-full absolute bottom-1 opacity-75"
                      style={{ backgroundColor: fingerColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualMechanicalKeyboard;
