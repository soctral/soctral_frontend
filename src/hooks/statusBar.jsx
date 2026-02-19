// hooks/useStatusBar.js
import { useEffect } from 'react';

export const useStatusBar = (color, style = 'default') => {
  useEffect(() => {
    const setStatusBarColor = (color, style) => {
      // For iOS Safari - theme color
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.content = color;

      // For iOS Safari - status bar style
      let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatusBar) {
        metaStatusBar = document.createElement('meta');
        metaStatusBar.name = 'apple-mobile-web-app-status-bar-style';
        document.head.appendChild(metaStatusBar);
      }
      metaStatusBar.content = style;

      // For Android Chrome
      let metaAndroid = document.querySelector('meta[name="msapplication-navbutton-color"]');
      if (!metaAndroid) {
        metaAndroid = document.createElement('meta');
        metaAndroid.name = 'msapplication-navbutton-color';
        document.head.appendChild(metaAndroid);
      }
      metaAndroid.content = color;
    };

    setStatusBarColor(color, style);

    // Cleanup function to reset to default
    return () => {
      setStatusBarColor('#ffffff', 'default');
    };
  }, [color, style]);
};

// Updated Onboarding component using the hook
import { useEffect, useState } from "react";
import { useStatusBar } from "./hooks/useStatusBar";
import logo from "../assets/soctraLogo.png";

export default function Onboarding({ onDone }) {
  const [show, setShow] = useState(true);
  
  // Set status bar color only when onboarding is showing
  useStatusBar(show ? "rgba(96, 60, 208, 1)" : "#ffffff", "default");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onDone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDone]);

  if (!show) return null;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-onboarding-gradient bg-cover text-center text-white">
      <img src={logo} alt="Company Logo" className="w-32 h-32" />
      <div className="absolute bottom-8 text-white text-2xl font-bold">
        Soctral
      </div>
    </div>
  );
}