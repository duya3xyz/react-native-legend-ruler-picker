import type { TextStyle } from 'react-native';
import type { RulerPickerItemProps } from './ruler-picker-item';
export type RulerPickerTextProps = Pick<TextStyle, 'color' | 'fontSize' | 'fontWeight'>;
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
export declare const RulerPicker: ({ width, height, min, max, step, initialValue, fractionDigits, unit, indicatorHeight, gapBetweenSteps, shortStepHeight, longStepHeight, stepWidth, indicatorColor, shortStepColor, longStepColor, valueTextStyle, unitTextStyle, decelerationRate, onValueChange, onValueChangeEnd, displayMode, longStepFractionDigits, }: RulerPickerProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ruler-picker.d.ts.map