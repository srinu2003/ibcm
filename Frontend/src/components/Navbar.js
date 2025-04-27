"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set initial window width
    setWindowWidth(window.innerWidth);
    
    // Update window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Close menu when resizing to desktop
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">IBCM</Link>
      </div>
      
      <div className={styles.hamburger} onClick={toggleMenu}>
        <div className={`${styles.bar} ${isMenuOpen ? styles.animateBar : ''}`}></div>
        <div className={`${styles.bar} ${isMenuOpen ? styles.animateBar : ''}`}></div>
        <div className={`${styles.bar} ${isMenuOpen ? styles.animateBar : ''}`}></div>
      </div>
      
      <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ''}`}>
        <li><Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
        <li><Link href="/progress-classfication" onClick={() => setIsMenuOpen(false)}>Progress classfication</Link></li>
        <li><Link href="/3dmodel" onClick={() => setIsMenuOpen(false)}>3D Model</Link></li>
        <li><Link href="/geo-tag-map" onClick={() => setIsMenuOpen(false)}>Geo Map</Link></li>
        <li><Link href="/workersafety" onClick={() => setIsMenuOpen(false)}>Worker Safety</Link></li>
        <li><Link href="/alerts" onClick={() => setIsMenuOpen(false)}>Alerts</Link></li>
        <li><Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
