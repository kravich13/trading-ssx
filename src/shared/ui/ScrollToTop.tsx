'use client';

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Fab, Zoom } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = useCallback(() => {
    const scrollStep = -window.scrollY / (300 / 15);
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 15);
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        className="mui-fixed"
        onClick={scrollToTop}
        color="primary"
        size="large"
        aria-label="scroll back to top"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 2000,
          opacity: 0.8,
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        <KeyboardArrowUpIcon fontSize="large" />
      </Fab>
    </Zoom>
  );
}
