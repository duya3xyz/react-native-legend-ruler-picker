/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Text, View } from 'react-native';

export type RulerPickerItemProps = {
  /**
   * Gap between steps
   *
   * @default 10
   */
  gapBetweenSteps: number;
  /**
   * Height of the short step
   *
   * @default 20
   */
  shortStepHeight: number;
  /**
   * Height of the long step
   *
   * @default 40
   */
  longStepHeight: number;
  /**
   * Width of the steps
   *
   * @default 2
   */
  stepWidth: number;
  /**
   * Color of the short steps
   *
   * @default 'lightgray'
   */
  shortStepColor: string;
  /**
   * Color of the long steps
   *
   * @default 'gray'
   */
  longStepColor: string;
  /**
   * Minimum value of the ruler (in ruler units, e.g. inches for feet mode)
   *
   * @default 0
   */
  min: number;
  /**
   * Step size of the ruler
   *
   * @default 1
   */
  step: number;
  /**
   * Number of decimal places to display for the value label
   *
   * @default 1
   */
  fractionDigits?: number;
  /**
   * Number of decimal places to display specifically on long step labels.
   * Overrides fractionDigits for long step labels only.
   *
   * @default fractionDigits
   */
  longStepFractionDigits?: number;
  /**
   * Display mode for the value labels
   * - 'decimal': 4.1, 4.2, 4.3...
   * - 'integer': 4, 5, 6...
   * - 'tens': 10, 20, 30...
   * - 'feet': 5' 0", 5' 1"... (min/max/step in inches)
   *
   * @default 'decimal'
   */
  displayMode?: 'decimal' | 'integer' | 'tens' | 'feet';
  /**
   * Index of the first available (min) item in the full array.
   * Items before this index are rendered as inactive (outside range).
   *
   * @default 0
   */
  firstAvailableIndex?: number;
  /**
   * Index of the last available (max) item in the full array.
   * Items after this index are rendered as inactive (outside range).
   */
  lastAvailableIndex?: number;
  /**
   * Total number of items in the array (including extra out-of-range items).
   * Used to decide whether to use simplified long-step logic for small rulers.
   */
  totalItems?: number;
  /**
   * Whether this item is outside the min/max range.
   * Inactive items are rendered at 50% opacity and still show their labels.
   *
   * @default false
   */
  isInactive?: boolean;
};

type Props = {
  index: number;
  isLast: boolean;
} & RulerPickerItemProps;

export const RulerPickerItem = React.memo(
  ({
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
    totalItems,
  }: Props) => {
    // Relative index from the first available (min) item
    const relativeIndex = index - firstAvailableIndex;

    const isFirstAvailable = index === firstAvailableIndex;
    const isLastAvailable =
      lastAvailableIndex !== undefined && index === lastAvailableIndex;

    // For feet mode: mark every foot boundary (every 12 inches) as a long step
    const rawValue = relativeIndex * step + min;
    const footRemainder = rawValue % 12;
    const isFootBoundary =
      displayMode === 'feet' &&
      (Math.abs(footRemainder) < 0.01 || Math.abs(footRemainder - 12) < 0.01);

    // Determine if this tick is a "long" step (shows a taller line + label)
    const isLong =
      totalItems && totalItems < 15
        ? isFirstAvailable || isLastAvailable
        : displayMode === 'feet'
          ? isFootBoundary || isFirstAvailable || isLastAvailable
          : relativeIndex % 10 === 0 || isFirstAvailable || isLastAvailable;

    const height = isLong ? longStepHeight * 0.75 : shortStepHeight;


    // Compute the label value for long steps
    let value: string;
    switch (displayMode) {
      case 'integer':
        value = Math.round(rawValue).toString();
        break;
      case 'tens':
        value = (Math.round(rawValue / 10) * 10).toString();
        break;
      case 'feet': {
        const feet = Math.floor(rawValue / 12);
        const inches = Math.round((rawValue % 12) * 2) / 2;
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

    return (
      <View
        style={{
          width: stepWidth,
          height: '100%',
          justifyContent: 'center',
          marginRight: isLast ? 0 : gapBetweenSteps,
          marginTop: shortStepHeight + 5,
          // Inactive items (outside min/max) are shown at 50% opacity
          opacity: isInactive ? 0.5 : 1,
        }}
      >
        {/* Show label on long steps — including inactive (out-of-range) ones */}
        {isLong && (
          <Text
            style={{
              color: 'white',
              width: textWidth,
              position: 'absolute',
              left: textLeft,
              top: -15,
              textAlign: 'center',
            }}
          >
            {value}
          </Text>
        )}

        <View
          style={{
            width: '100%',
            height: height,
            backgroundColor: isLong ? longStepColor : shortStepColor,
            marginTop: isLong ? -3 : shortStepHeight,
          }}
        />
      </View>
    );
  }
);
