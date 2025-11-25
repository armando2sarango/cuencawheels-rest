import React from "react";
import "./loader.css";
import waterLoader from "../../files/load.svg";
const Loader = ({ isExiting }) => { 
  return (
    <div className={`global-loader ${isExiting ? 'hidden' : ''}`}>
      <div className="loader-wrapper">
        <div className="spinner-circle"></div> 
        <img src={waterLoader} alt="Cargando..." className="loader-logo" /> 
      </div>
      {/* <img src={waterLoader} alt="Cargando..." className="loader-logo" /> */} 

      <p className="loader-text">Cargando...</p>
    </div>
  );
};

export default Loader;