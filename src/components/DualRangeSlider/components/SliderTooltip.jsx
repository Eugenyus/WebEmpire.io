import React, { forwardRef } from 'react';
import { formatCurrency } from '../../../utils/formatters';

const SliderTooltip = forwardRef(({ value }, ref) => {
  return (
    <div ref={ref} className="price-tooltip">
      {formatCurrency(value)}
    </div>
  );
});

SliderTooltip.displayName = 'SliderTooltip';

export default SliderTooltip;