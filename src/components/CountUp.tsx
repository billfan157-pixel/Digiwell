import React, { useEffect, useState } from 'react';

export default function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800; // 0.8 giây
    const frameRate = 1000 / 60; // 60 FPS
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Easing function cho mượt (chạy nhanh lúc đầu, chậm lúc sau)
      const easeOut = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * easeOut);
      setDisplayValue(current);

      if (frame >= totalFrames) {
        clearInterval(counter);
        setDisplayValue(end);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [value]);

  return <span>{displayValue.toLocaleString('vi-VN')}</span>;
}