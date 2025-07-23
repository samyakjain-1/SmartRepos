import React, { useEffect, useState, useRef } from 'react';

interface RotatingTextProps {
  staticText: string;
  rotatingWords: string[];
  className?: string;
}

export default function RotatingText({ staticText, rotatingWords, className = '' }: RotatingTextProps) {
  const [listTop, setListTop] = useState(0);
  const [listWidth, setListWidth] = useState(0);
  const [wordOrder, setWordOrder] = useState(rotatingWords);
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize width after component mounts and whenever wordOrder changes
  useEffect(() => {
    const initWidth = () => {
      if (spanRefs.current[0]) {
        // Force a reflow to ensure accurate measurement
        spanRefs.current[0].style.width = 'auto';
        const width = spanRefs.current[0].offsetWidth;
        console.log('Setting width to:', width, 'for word:', wordOrder[0]);
        setListWidth(width + 2); // Add small padding
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(initWidth);
  }, [wordOrder]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Get the next word's width (index 1 since we want the second item)
      const nextSpan = spanRefs.current[1];
      if (nextSpan) {
        const nextWidth = nextSpan.offsetWidth + 2; // Add padding
        console.log('Next word width:', nextWidth, 'for word:', wordOrder[1]);
        
        // Animate to next position
        setListWidth(nextWidth);
        setListTop(-1.2); // Move up by line height in em

        // After animation completes, reset and reorder
        setTimeout(() => {
          // Move first item to end
          const newOrder = [...wordOrder.slice(1), wordOrder[0]];
          setWordOrder(newOrder);
          setListTop(0);
        }, 200);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [wordOrder]);

  const rotatingListStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    verticalAlign: 'text-top',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    width: listWidth > 0 ? `${listWidth}px` : 'auto',
    minWidth: '100px',
    height: '1.2em',
    overflow: 'hidden', // Hide text that's sliding up/down
    transition: 'width 0.2s ease-in-out, top 0.2s ease-in-out',
    top: `${listTop}em`
  };

  const getRotatingItemStyle = (index: number): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#2dc687',
    fontWeight: 'bold',
    top: `${index * 1.2}em`
  });

  return (
    <div className={`relative inline-block ${className}`}>
      <div style={{ position: 'relative', fontWeight: 'bold', overflow: 'hidden', lineHeight: 1.2 }}>
        {staticText}{' '}
        <ul style={rotatingListStyle}>
          {wordOrder.map((word, index) => (
            <li
              key={`${word}-${index}`}
              style={getRotatingItemStyle(index)}
            >
              <span 
                ref={(el) => spanRefs.current[index] = el}
              >
                {word}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 