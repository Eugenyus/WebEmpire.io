import React, { useRef } from 'react';
import SliderBackground from './components/SliderBackground';
import SliderTooltip from './components/SliderTooltip';
import RangeInput from './components/RangeInput';
import { useRangeSlider } from './hooks/useRangeSlider';
import './styles/slider.css';
import './styles/range.css';
import './styles/tooltip.css';

export default function DualRangeSlider({ minValue, maxValue, onChange }) {
  const minTooltipRef = useRef(null);
  const maxTooltipRef = useRef(null);
  
  const {
    handleMinChange,
    handleMaxChange
  } = useRangeSlider(minTooltipRef, maxTooltipRef, minValue, maxValue, onChange);

  return (
    <div className="slider-container">
      <SliderBackground />
      <div className="price-slider"></div>
      <div className="range-input">
        <SliderTooltip value={minValue} ref={minTooltipRef} />
        <SliderTooltip value={maxValue} ref={maxTooltipRef} />
        <RangeInput 
          value={minValue}
          onChange={handleMinChange}
          isMin={true}
        />
        <RangeInput 
          value={maxValue}
          onChange={handleMaxChange}
          isMin={false}
        />
      </div>
    </div>
  );
}