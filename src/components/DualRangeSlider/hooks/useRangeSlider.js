import { useEffect } from 'react';
import { SLIDER_CONFIG } from '../constants';

export function useRangeSlider(minTooltipRef, maxTooltipRef, minValue, maxValue, onChange) {
  const handleMinChange = (e) => {
    const value = parseInt(e.target.value);
    if (value < maxValue - SLIDER_CONFIG.PRICE_GAP) {
      onChange(value, maxValue);
    }
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > minValue + SLIDER_CONFIG.PRICE_GAP) {
      onChange(minValue, value);
    }
  };

  useEffect(() => {
    if (minTooltipRef.current && maxTooltipRef.current) {
      const minPercent = ((minValue - SLIDER_CONFIG.MIN) / (SLIDER_CONFIG.MAX - SLIDER_CONFIG.MIN)) * 100;
      const maxPercent = ((maxValue - SLIDER_CONFIG.MIN) / (SLIDER_CONFIG.MAX - SLIDER_CONFIG.MIN)) * 100;
      
      minTooltipRef.current.style.left = `${minPercent}%`;
      maxTooltipRef.current.style.left = `${maxPercent}%`;
    }
  }, [minValue, maxValue, minTooltipRef, maxTooltipRef]);

  return {
    handleMinChange,
    handleMaxChange
  };
}