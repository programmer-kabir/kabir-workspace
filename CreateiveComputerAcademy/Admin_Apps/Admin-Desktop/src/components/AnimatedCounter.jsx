import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedCounter = ({ value, duration = 1.2, className = '' }) => {
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
    duration: duration * 1000
  });

  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    spring.set(numericValue);
  }, [numericValue, spring]);

  return <motion.span className={className}>{display}</motion.span>;
};

export default AnimatedCounter;
