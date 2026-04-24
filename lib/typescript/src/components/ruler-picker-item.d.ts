import React from 'react';
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
export declare const RulerPickerItem: React.MemoExoticComponent<({ isLast, index, isInactive, firstAvailableIndex, lastAvailableIndex, gapBetweenSteps, shortStepHeight, longStepHeight, stepWidth, shortStepColor, longStepColor, min, step, fractionDigits, longStepFractionDigits, displayMode, totalItems, }: Props) => import("react/jsx-runtime").JSX.Element>;
export {};
//# sourceMappingURL=ruler-picker-item.d.ts.map