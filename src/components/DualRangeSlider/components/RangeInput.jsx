import React from 'react';
import { SLIDER_CONFIG } from '../constants';

export default function RangeInput({ value, onChange, isMin }) {
  return (
    <input
      type="range"
      className={isMin ? "min-range" : "max-range"}
      min={SLIDER_CONFIG.MIN}
      max={SLIDER_CONFIG.MAX}
      value={value}
      step={SLIDER_CONFIG.STEP}
      onChange={onChange}
    />
  );
}