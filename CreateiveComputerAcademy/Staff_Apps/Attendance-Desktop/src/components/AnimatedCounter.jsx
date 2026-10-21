import React, { useEffect, useState } from 'react';

export const AnimatedCounter = ({ value, duration = 1.0, className = '' }) => {
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  const [displayValue, setDisplayValue] = useState(numericValue);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const endValue = numericValue;
    const durMs = duration * 1000;

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durMs, 1);
      // cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (endValue - startValue) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [numericValue]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
};

export default AnimatedCounter;
