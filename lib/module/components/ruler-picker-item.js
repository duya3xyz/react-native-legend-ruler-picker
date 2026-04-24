"use strict";

/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Text, View } from 'react-native';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const RulerPickerItem = /*#__PURE__*/React.memo(({
  isLast,
  index,
  isInactive = false,
  firstAvailableIndex = 0,
  lastAvailableIndex,
  gapBetweenSteps,
  shortStepHeight,
  longStepHeight,
  stepWidth,
  shortStepColor,
  longStepColor,
  min,
  step,
  fractionDigits = 1,
  longStepFractionDigits,
  displayMode = 'decimal',
  totalItems
}) => {
  // Relative index from the first available (min) item
  const relativeIndex = index - firstAvailableIndex;
  const isFirstAvailable = index === firstAvailableIndex;
  const isLastAvailable = lastAvailableIndex !== undefined && index === lastAvailableIndex;

  // For feet mode: mark every foot boundary (every 12 inches) as a long step
  const rawValue = relativeIndex * step + min;
  const footRemainder = rawValue % 12;
  const isFootBoundary = displayMode === 'feet' && (Math.abs(footRemainder) < 0.01 || Math.abs(footRemainder - 12) < 0.01);

  // Determine if this tick is a "long" step (shows a taller line + label)
  const isLong = totalItems && totalItems < 15 ? isFirstAvailable || isLastAvailable : displayMode === 'feet' ? isFootBoundary || isFirstAvailable || isLastAvailable : relativeIndex % 10 === 0 || isFirstAvailable || isLastAvailable;
  const height = isLong ? longStepHeight * 0.75 : shortStepHeight;

  // Compute the label value for long steps
  let value;
  switch (displayMode) {
    case 'integer':
      value = Math.round(rawValue).toString();
      break;
    case 'tens':
      value = (Math.round(rawValue / 10) * 10).toString();
      break;
    case 'feet':
      {
        const feet = Math.floor(rawValue / 12);
        const inches = Math.round(rawValue % 12 * 2) / 2;
        const inchStr = inches % 1 === 0 ? `${Math.round(inches)}` : inches.toFixed(1);
        value = `${feet}' ${inchStr}"`;
        break;
      }
    case 'decimal':
    default:
      value = rawValue.toFixed(longStepFractionDigits ?? fractionDigits);
  }
  const textWidth = displayMode === 'feet' ? 55 : 30;
  const textLeft = displayMode === 'feet' ? -25 : -15;
  return /*#__PURE__*/_jsxs(View, {
    style: {
      width: stepWidth,
      height: '100%',
      justifyContent: 'center',
      marginRight: isLast ? 0 : gapBetweenSteps,
      marginTop: shortStepHeight + 5,
      // Inactive items (outside min/max) are shown at 50% opacity
      opacity: isInactive ? 0.5 : 1
    },
    children: [isLong && /*#__PURE__*/_jsx(Text, {
      style: {
        color: 'white',
        width: textWidth,
        position: 'absolute',
        left: textLeft,
        top: -15,
        textAlign: 'center'
      },
      children: value
    }), /*#__PURE__*/_jsx(View, {
      style: {
        width: '100%',
        height: height,
        backgroundColor: isLong ? longStepColor : shortStepColor,
        marginTop: isLong ? -3 : shortStepHeight
      }
    })]
  });
});
//# sourceMappingURL=ruler-picker-item.js.map