import React, { useState, useEffect } from 'react';
import './App.css';
import ConfigRouter from './services/configRouter';
import { useActivityTimeout } from './services/auth';
import Loader from './components/Loader/loader';
import { setLoaderHandlers } from './utils/loaderManager';
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hideLoader = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsExiting(false); 
    }, 500); 
  };
useEffect(() => {
    setLoaderHandlers(
      () => setIsLoading(true), 
      hideLoader 
    );
  }, []);
  const actionOnExpire = () => {
    alert("Tu sesión ha expirado por inactividad.");
    window.location.href = '/';
  };
  useActivityTimeout(10 * 60 * 1000, actionOnExpire);
return (
    <>
      {(isLoading || isExiting) && (
        <Loader 
          isExiting={isExiting} 
        />
      )}
      <ConfigRouter />
    </>
  );
}

export default App;
