"use strict";

// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View, Text, Animated, TextInput } from 'react-native';
import { AnimatedLegendList } from '@legendapp/list/animated';
import { RulerPickerItem } from "./ruler-picker-item.js";
import { calculateCurrentValue } from "../utils/calculations.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const {
  width: windowWidth
} = Dimensions.get('window');
/**
 * Convert a raw inch value string to a "X' Y"" display string.
 */
const formatFeetDisplay = rawValue => {
  const totalInches = parseFloat(rawValue);
  if (isNaN(totalInches)) return rawValue;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12 * 10) / 10;
  const inchStr = inches % 1 === 0 ? `${Math.round(inches)}` : inches.toFixed(1);
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
  longStepFractionDigits
}) => {
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
  const arrData = Array.from({
    length: totalItems
  }, (_, index) => index);
  const listRef = useRef(null);
  const isInitialScrollDone = useRef(false);
  const initialScrollTimer = useRef(null);
  const isScrollingBack = useRef(false);

  // In feet mode, the raw value is in inches — fractionDigits=1 is sufficient
  const fractionDigitsWithDisplayMode = useMemo(() => {
    if (displayMode === 'feet') return 1;
    return fractionDigits;
  }, [displayMode, fractionDigits]);

  // Use a TextInput ref so we can update the displayed value with setNativeProps
  // (no React re-render, smoother scrolling).
  const stepTextRef = useRef(null);
  const prevValue = useRef(initialValue.toFixed(fractionDigitsWithDisplayMode));
  const prevMomentumValue = useRef(initialValue.toFixed(fractionDigitsWithDisplayMode));
  const scrollPosition = useRef(new Animated.Value(0)).current;
  const formatDisplay = useCallback(rawValue => {
    if (displayMode === 'feet') return formatFeetDisplay(rawValue);
    return rawValue;
  }, [displayMode]);
  const valueCallback = useCallback(({
    value
  }) => {
    const newStep = calculateCurrentValue(value, stepWidth, gapBetweenSteps, minForCalculation, max, step, fractionDigitsWithDisplayMode);
    if (prevValue.current !== newStep) {
      if (isInitialScrollDone.current) {
        onValueChange?.(newStep);
        stepTextRef.current?.setNativeProps({
          text: formatDisplay(newStep)
        });
      }
    }
    prevValue.current = newStep;
  }, [fractionDigitsWithDisplayMode, gapBetweenSteps, stepWidth, max, minForCalculation, onValueChange, step, formatDisplay]);
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
  const scrollHandler = Animated.event([{
    nativeEvent: {
      contentOffset: {
        x: scrollPosition
      }
    }
  }], {
    useNativeDriver: true
  });
  const renderSeparator = useCallback(() => /*#__PURE__*/_jsx(View, {
    style: {
      width: width * 0.5 - stepWidth * 0.5
    }
  }), [stepWidth, width]);
  const renderItem = useCallback(({
    index
  }) => {
    return /*#__PURE__*/_jsx(RulerPickerItem, {
      isLast: index === arrData.length - 1,
      isInactive: index < firstAvailableIndex || index > lastAvailableIndex,
      firstAvailableIndex: firstAvailableIndex,
      lastAvailableIndex: lastAvailableIndex,
      index: index,
      shortStepHeight: shortStepHeight,
      longStepHeight: longStepHeight,
      gapBetweenSteps: gapBetweenSteps,
      stepWidth: stepWidth,
      shortStepColor: shortStepColor,
      longStepColor: longStepColor,
      min: min,
      step: step,
      displayMode: displayMode,
      totalItems: arrData.length,
      fractionDigits: fractionDigitsWithDisplayMode,
      longStepFractionDigits: longStepFractionDigits
    });
  }, [arrData.length, firstAvailableIndex, lastAvailableIndex, gapBetweenSteps, stepWidth, longStepColor, longStepHeight, shortStepColor, shortStepHeight, min, step, displayMode, fractionDigitsWithDisplayMode, longStepFractionDigits]);

  /**
   * When the scroll view settles outside the valid [min, max] range, animate
   * back to the nearest boundary.  Uses a two-phase approach for large
   * distances: instant jump close to the target, then a smooth animation for
   * the last few steps.
   */
  const scrollBackToRange = useCallback(rawIndex => {
    if (isScrollingBack.current) return;
    isScrollingBack.current = true;
    const targetIndex = rawIndex < firstAvailableIndex ? firstAvailableIndex : lastAvailableIndex;
    const stepSize = stepWidth + gapBetweenSteps;
    const targetOffset = targetIndex * stepSize;
    listRef.current?.scrollToOffset({
      offset: targetOffset,
      animated: true
    });
    setTimeout(() => {
      isScrollingBack.current = false;
    }, 600);
  }, [firstAvailableIndex, lastAvailableIndex, stepWidth, gapBetweenSteps]);
  const onMomentumScrollEnd = useCallback(event => {
    if (isScrollingBack.current) return;
    const position = event.nativeEvent.contentOffset.x || event.nativeEvent.contentOffset.y || 0;
    const rawIndex = Math.round(position / (stepWidth + gapBetweenSteps));
    const newStep = calculateCurrentValue(position, stepWidth, gapBetweenSteps, minForCalculation, max, step, fractionDigitsWithDisplayMode);
    if (rawIndex < firstAvailableIndex || rawIndex > lastAvailableIndex) {
      scrollBackToRange(rawIndex);
    }
    if (prevMomentumValue.current !== newStep) {
      onValueChangeEnd?.(newStep);
    }
    prevMomentumValue.current = newStep;
  }, [fractionDigitsWithDisplayMode, gapBetweenSteps, stepWidth, max, minForCalculation, onValueChangeEnd, step, firstAvailableIndex, lastAvailableIndex, scrollBackToRange]);

  /**
   * Handles the case where the user drags slowly (no momentum phase).
   * If the drag ends outside the valid range, snap back immediately.
   */
  const onScrollEndDrag = useCallback(event => {
    const position = event.nativeEvent.contentOffset.x || 0;
    const rawIndex = Math.round(position / (stepWidth + gapBetweenSteps));
    if (rawIndex < firstAvailableIndex || rawIndex > lastAvailableIndex) {
      scrollBackToRange(rawIndex);
    }
  }, [firstAvailableIndex, lastAvailableIndex, stepWidth, gapBetweenSteps, scrollBackToRange]);
  const onContentSizeChange = useCallback(() => {
    if (isInitialScrollDone.current) return;
    const initialIndex = firstAvailableIndex + Math.round((initialValue - min) / step);
    listRef.current?.scrollToOffset({
      offset: initialIndex * (stepWidth + gapBetweenSteps),
      animated: false
    });
    if (initialScrollTimer.current) {
      clearTimeout(initialScrollTimer.current);
    }
    initialScrollTimer.current = setTimeout(() => {
      isInitialScrollDone.current = true;
      prevValue.current = initialValue.toFixed(fractionDigitsWithDisplayMode);
    }, 300);
  }, [firstAvailableIndex, initialValue, min, step, stepWidth, gapBetweenSteps, fractionDigitsWithDisplayMode]);
  const initialDisplayValue = formatDisplay(initialValue.toFixed(fractionDigitsWithDisplayMode));
  return /*#__PURE__*/_jsxs(View, {
    style: {
      width,
      height
    },
    children: [/*#__PURE__*/_jsx(AnimatedLegendList, {
      ref: listRef,
      data: arrData,
      keyExtractor: (_, index) => index.toString(),
      renderItem: renderItem,
      ListHeaderComponent: renderSeparator,
      ListFooterComponent: renderSeparator,
      onScroll: scrollHandler,
      onMomentumScrollEnd: onMomentumScrollEnd,
      onScrollEndDrag: onScrollEndDrag,
      estimatedItemSize: stepWidth + gapBetweenSteps,
      getFixedItemSize: () => stepWidth + gapBetweenSteps,
      recycleItems: true,
      drawDistance: 500,
      snapToOffsets: arrData.map((_, index) => index * (stepWidth + gapBetweenSteps)),
      onContentSizeChange: onContentSizeChange,
      snapToAlignment: "start",
      decelerationRate: decelerationRate,
      scrollEventThrottle: 16,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      horizontal: true,
      bounces: true
    }), /*#__PURE__*/_jsxs(View, {
      pointerEvents: "none",
      style: [styles.indicator, {
        transform: [{
          translateX: -stepWidth * 0.5
        }, {
          translateY: -indicatorHeight * 0.55 - (valueTextStyle?.fontSize ?? styles.valueText.fontSize)
        }],
        left: stepWidth * 0.5
      }],
      children: [/*#__PURE__*/_jsxs(View, {
        style: [styles.displayTextContainer, {
          height: valueTextStyle?.fontSize ?? styles.valueText.fontSize,
          transform: [{
            translateY: -(valueTextStyle?.fontSize ?? styles.valueText.fontSize) * 0.5
          }]
        }],
        children: [/*#__PURE__*/_jsx(TextInput, {
          ref: stepTextRef,
          defaultValue: initialDisplayValue,
          editable: false,
          style: [{
            lineHeight: valueTextStyle?.fontSize ?? styles.valueText.fontSize
          }, styles.valueText, valueTextStyle]
        }), unit ? /*#__PURE__*/_jsx(Text, {
          style: [{
            lineHeight: unitTextStyle?.fontSize ?? styles.unitText.fontSize
          }, styles.unitText, unitTextStyle],
          children: unit
        }) : null]
      }), /*#__PURE__*/_jsx(View, {
        style: {
          width: stepWidth,
          height: indicatorHeight,
          backgroundColor: indicatorColor
        }
      })]
    })]
  });
};
const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    alignItems: 'center'
  },
  displayTextContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  valueText: {
    color: 'black',
    fontSize: 32,
    fontWeight: '800',
    margin: 0,
    padding: 0
  },
  unitText: {
    color: 'black',
    fontSize: 24,
    fontWeight: '400',
    marginLeft: 6
  }
});
//# sourceMappingURL=ruler-picker.js.map