// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  Animated,
  TextInput,
} from 'react-native';
import type {
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import { AnimatedLegendList } from '@legendapp/list/animated';
import type { LegendListRef } from '@legendapp/list';

import { RulerPickerItem } from './ruler-picker-item';
import type { RulerPickerItemProps } from './ruler-picker-item';
import { calculateCurrentValue } from '../utils/calculations';

export type RulerPickerTextProps = Pick<
  TextStyle,
  'color' | 'fontSize' | 'fontWeight'
>;

const { width: windowWidth } = Dimensions.get('window');

export type RulerPickerProps = {
  /**
   * Width of the ruler picker
   * @default windowWidth
   */
  width?: number;
  /**
   * Height of the ruler picker
   * @default 500
   */
  height?: number;
  /**
   * Minimum value of the ruler picker.
   * For feet mode, provide the value in inches (e.g. 48 = 4 feet).
   */
  min: number;
  /**
   * Maximum value of the ruler picker.
   * For feet mode, provide the value in inches (e.g. 84 = 7 feet).
   */
  max: number;
  /**
   * Step size between ticks.
   * For feet mode, this is in inches (e.g. step=1 means 1-inch increments).
   *
   * @default 1
   */
  step?: number;
  /**
   * Initial selected value.
   * For feet mode, provide the value in inches.
   *
   * @default min
   */
  initialValue?: number;
  /**
   * Number of decimal digits shown in the value indicator and onValueChange callbacks.
   *
   * @default 1
   */
  fractionDigits?: number;
  /**
   * Unit label shown next to the value (e.g. 'cm', 'kg', 'sec').
   * Set to empty string to hide.
   *
   * @default 'cm'
   */
  unit?: string;
  /**
   * Height of the center indicator line
   *
   * @default 80
   */
  indicatorHeight?: number;
  /**
   * Color of the center indicator line
   *
   * @default 'black'
   */
  indicatorColor?: string;
  /**
   * Text style overrides for the value display
   */
  valueTextStyle?: RulerPickerTextProps;
  /**
   * Text style overrides for the unit label
   */
  unitTextStyle?: RulerPickerTextProps;
  /**
   * Deceleration rate of the scroll view after the user lifts their finger.
   *
   * @default 'normal'
   */
  decelerationRate?: 'fast' | 'normal' | number;
  /**
   * Display mode for tick labels and the value indicator:
   * - 'decimal': 4.1, 4.2, 4.3...
   * - 'integer': 4, 5, 6...
   * - 'tens': 10, 20, 30...
   * - 'feet': 5' 0", 5' 1"... (min/max/step must be in inches)
   *
   * @default 'decimal'
   */
  displayMode?: 'decimal' | 'integer' | 'tens' | 'feet';
  /**
   * Decimal places used only for long-step tick labels.
   * Overrides fractionDigits for label display only.
   *
   * @default fractionDigits
   */
  longStepFractionDigits?: number;
  /**
   * Called continuously as the user scrolls (throttled to 16 ms).
   * Receives the current raw value as a string (inches for feet mode).
   */
  onValueChange?: (value: string) => void;
  /**
   * Called once when the user finishes scrolling and the picker settles.
   * Receives the final raw value as a string.
   */
  onValueChangeEnd?: (value: string) => void;
} & Partial<RulerPickerItemProps>;

/**
 * Convert a raw inch value string to a "X' Y"" display string.
 */
const formatFeetDisplay = (rawValue: string): string => {
  const totalInches = parseFloat(rawValue);
  if (isNaN(totalInches)) return rawValue;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  const inchStr =
    inches % 1 === 0 ? `${Math.round(inches)}` : inches.toFixed(1);
  return `${feet}' ${inchStr}"`;
};

export const RulerPicker = ({
  width = windowWidth,
  height = 500,
  min,
  max,
  step = 1,
  initialValue = min,
  fractionDigits = 1,
  unit = 'cm',
  indicatorHeight = 80,
  gapBetweenSteps = 10,
  shortStepHeight = 20,
  longStepHeight = 40,
  stepWidth = 2,
  indicatorColor = 'black',
  shortStepColor = 'lightgray',
  longStepColor = 'darkgray',
  valueTextStyle,
  unitTextStyle,
  decelerationRate = 'normal',
  onValueChange,
  onValueChangeEnd,
  displayMode = 'decimal',
  longStepFractionDigits,
}: RulerPickerProps) => {
  // Extra items rendered before min and after max so the user can scroll
  // slightly beyond the range; the picker auto-snaps back on release.
  const extraItems = 20;
  const itemAmount = (max - min) / step;
  const availableItemsCount = itemAmount + 1;
  const firstAvailableIndex = extraItems;
  const lastAvailableIndex = extraItems + availableItemsCount - 1;
  const totalItems = availableItemsCount + extraItems * 2;
  // Virtual min used in offset→value math to account for the extra prefix items
  const minForCalculation = min - firstAvailableIndex * step;

  const arrData = Array.from({ length: totalItems }, (_, index) => index);

  const listRef = useRef<LegendListRef>(null);
  const isInitialScrollDone = useRef(false);
  const initialScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingBack = useRef(false);

  // In feet mode, the raw value is in inches — fractionDigits=1 is sufficient
  const fractionDigitsWithDisplayMode = useMemo(() => {
    if (displayMode === 'feet') return 1;
    return fractionDigits;
  }, [displayMode, fractionDigits]);

  // Use a TextInput ref so we can update the displayed value with setNativeProps
  // (no React re-render, smoother scrolling).
  const stepTextRef = useRef<TextInput>(null);
  const prevValue = useRef<string>(
    initialValue.toFixed(fractionDigitsWithDisplayMode)
  );
  const prevMomentumValue = useRef<string>(
    initialValue.toFixed(fractionDigitsWithDisplayMode)
  );
  const scrollPosition = useRef(new Animated.Value(0)).current;

  const formatDisplay = useCallback(
    (rawValue: string): string => {
      if (displayMode === 'feet') return formatFeetDisplay(rawValue);
      return rawValue;
    },
    [displayMode]
  );

  const valueCallback: Animated.ValueListenerCallback = useCallback(
    ({ value }) => {
      const newStep = calculateCurrentValue(
        value,
        stepWidth,
        gapBetweenSteps,
        minForCalculation,
        max,
        step,
        fractionDigitsWithDisplayMode
      );

      if (prevValue.current !== newStep) {
        if (isInitialScrollDone.current) {
          onValueChange?.(newStep);
          stepTextRef.current?.setNativeProps({
            text: formatDisplay(newStep),
          });
        }
      }

      prevValue.current = newStep;
    },
    [
      fractionDigitsWithDisplayMode,
      gapBetweenSteps,
      stepWidth,
      max,
      minForCalculation,
      onValueChange,
      step,
      formatDisplay,
    ]
  );

  useEffect(() => {
    scrollPosition.addListener(valueCallback);
    return () => {
      scrollPosition.removeAllListeners();
    };
  }, [scrollPosition, valueCallback]);

  useEffect(() => {
    return () => {
      if (initialScrollTimer.current) {
        clearTimeout(initialScrollTimer.current);
      }
    };
  }, []);

  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollPosition } } }],
    { useNativeDriver: true }
  );

  const renderSeparator = useCallback(
    () => <View style={{ width: width * 0.5 - stepWidth * 0.5 }} />,
    [stepWidth, width]
  );

  const renderItem = useCallback(
    ({ index }: { item: number; index: number }) => {
      return (
        <RulerPickerItem
          isLast={index === arrData.length - 1}
          isInactive={
            index < firstAvailableIndex || index > lastAvailableIndex
          }
          firstAvailableIndex={firstAvailableIndex}
          lastAvailableIndex={lastAvailableIndex}
          index={index}
          shortStepHeight={shortStepHeight}
          longStepHeight={longStepHeight}
          gapBetweenSteps={gapBetweenSteps}
          stepWidth={stepWidth}
          shortStepColor={shortStepColor}
          longStepColor={longStepColor}
          min={min}
          step={step}
          displayMode={displayMode}
          totalItems={arrData.length}
          fractionDigits={fractionDigitsWithDisplayMode}
          longStepFractionDigits={longStepFractionDigits}
        />
      );
    },
    [
      arrData.length,
      firstAvailableIndex,
      lastAvailableIndex,
      gapBetweenSteps,
      stepWidth,
      longStepColor,
      longStepHeight,
      shortStepColor,
      shortStepHeight,
      min,
      step,
      displayMode,
      fractionDigitsWithDisplayMode,
      longStepFractionDigits,
    ]
  );

  /**
   * When the scroll view settles outside the valid [min, max] range, animate
   * back to the nearest boundary.  Uses a two-phase approach for large
   * distances: instant jump close to the target, then a smooth animation for
   * the last few steps.
   */
  const scrollBackToRange = useCallback(
    (rawIndex: number) => {
      if (isScrollingBack.current) return;
      isScrollingBack.current = true;

      const targetIndex =
        rawIndex < firstAvailableIndex
          ? firstAvailableIndex
          : lastAvailableIndex;
      const stepSize = stepWidth + gapBetweenSteps;
      const targetOffset = targetIndex * stepSize;

      listRef.current?.scrollToOffset({ offset: targetOffset, animated: true });

      setTimeout(() => {
        isScrollingBack.current = false;
      }, 600);
    },
    [firstAvailableIndex, lastAvailableIndex, stepWidth, gapBetweenSteps]
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrollingBack.current) return;
      const position =
        event.nativeEvent.contentOffset.x ||
        event.nativeEvent.contentOffset.y ||
        0;
      const rawIndex = Math.round(position / (stepWidth + gapBetweenSteps));
      const newStep = calculateCurrentValue(
        position,
        stepWidth,
        gapBetweenSteps,
        minForCalculation,
        max,
        step,
        fractionDigitsWithDisplayMode
      );

      if (rawIndex < firstAvailableIndex || rawIndex > lastAvailableIndex) {
        scrollBackToRange(rawIndex);
      }

      if (prevMomentumValue.current !== newStep) {
        onValueChangeEnd?.(newStep);
      }
      prevMomentumValue.current = newStep;
    },
    [
      fractionDigitsWithDisplayMode,
      gapBetweenSteps,
      stepWidth,
      max,
      minForCalculation,
      onValueChangeEnd,
      step,
      firstAvailableIndex,
      lastAvailableIndex,
      scrollBackToRange,
    ]
  );

  /**
   * Handles the case where the user drags slowly (no momentum phase).
   * If the drag ends outside the valid range, snap back immediately.
   */
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const position = event.nativeEvent.contentOffset.x || 0;
      const rawIndex = Math.round(position / (stepWidth + gapBetweenSteps));

      if (rawIndex < firstAvailableIndex || rawIndex > lastAvailableIndex) {
        scrollBackToRange(rawIndex);
      }
    },
    [firstAvailableIndex, lastAvailableIndex, stepWidth, gapBetweenSteps, scrollBackToRange]
  );

  const onContentSizeChange = useCallback(() => {
    if (isInitialScrollDone.current) return;

    const initialIndex =
      firstAvailableIndex + Math.round((initialValue - min) / step);
    listRef.current?.scrollToOffset({
      offset: initialIndex * (stepWidth + gapBetweenSteps),
      animated: false,
    });

    if (initialScrollTimer.current) {
      clearTimeout(initialScrollTimer.current);
    }
    initialScrollTimer.current = setTimeout(() => {
      isInitialScrollDone.current = true;
      prevValue.current = initialValue.toFixed(fractionDigitsWithDisplayMode);
    }, 300);
  }, [
    firstAvailableIndex,
    initialValue,
    min,
    step,
    stepWidth,
    gapBetweenSteps,
    fractionDigitsWithDisplayMode,
  ]);

  const initialDisplayValue = formatDisplay(
    initialValue.toFixed(fractionDigitsWithDisplayMode)
  );

  return (
    <View style={{ width, height }}>
      <AnimatedLegendList
        ref={listRef}
        data={arrData}
        keyExtractor={(_: number, index: number) => index.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderSeparator}
        ListFooterComponent={renderSeparator}
        onScroll={scrollHandler}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
        estimatedItemSize={stepWidth + gapBetweenSteps}
        getFixedItemSize={() => stepWidth + gapBetweenSteps}
        recycleItems
        drawDistance={500}
        snapToOffsets={arrData.map(
          (_, index) => index * (stepWidth + gapBetweenSteps)
        )}
        onContentSizeChange={onContentSizeChange}
        snapToAlignment="start"
        decelerationRate={decelerationRate}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        horizontal
        bounces
      />

      {/* Indicator overlay — center line + value text */}
      <View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            transform: [
              { translateX: -stepWidth * 0.5 },
              {
                translateY:
                  -indicatorHeight * 0.55 -
                  (valueTextStyle?.fontSize ?? styles.valueText.fontSize),
              },
            ],
            left: stepWidth * 0.5,
          },
        ]}
      >
        <View
          style={[
            styles.displayTextContainer,
            {
              height: valueTextStyle?.fontSize ?? styles.valueText.fontSize,
              transform: [
                {
                  translateY:
                    -(valueTextStyle?.fontSize ?? styles.valueText.fontSize) *
                    0.5,
                },
              ],
            },
          ]}
        >
          <TextInput
            ref={stepTextRef}
            defaultValue={initialDisplayValue}
            editable={false}
            style={[
              {
                lineHeight:
                  valueTextStyle?.fontSize ?? styles.valueText.fontSize,
              },
              styles.valueText,
              valueTextStyle,
            ]}
          />
          {unit ? (
            <Text
              style={[
                {
                  lineHeight:
                    unitTextStyle?.fontSize ?? styles.unitText.fontSize,
                },
                styles.unitText,
                unitTextStyle,
              ]}
            >
              {unit}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            width: stepWidth,
            height: indicatorHeight,
            backgroundColor: indicatorColor,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    alignItems: 'center',
  },
  displayTextContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: 'black',
    fontSize: 32,
    fontWeight: '800',
    margin: 0,
    padding: 0,
  },
  unitText: {
    color: 'black',
    fontSize: 24,
    fontWeight: '400',
    marginLeft: 6,
  },
});
