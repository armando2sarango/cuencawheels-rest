import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFacturaById } from '../../store/facturas/restCalls';

const VisorFacturaIframe = () => {
  const [urlFactura, setUrlFactura] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoDato, setTipoDato] = useState('html'); // 'html' o 'pdf'
  
  const [searchParams] = useSearchParams();
  const idFactura = searchParams.get('id');

  useEffect(() => {
    return () => {
      if (urlFactura && urlFactura.startsWith('blob:')) {
        URL.revokeObjectURL(urlFactura);
      }
    };
  }, [urlFactura]);

  useEffect(() => {
    if (!idFactura) {
      setError('No se proporcionó un ID de factura');
      setLoading(false);
      return;
    }

    cargarUrlFactura(idFactura);
  }, [idFactura]);

  const cargarUrlFactura = async (id) => {
    if (urlFactura && urlFactura.startsWith('blob:')) {
      URL.revokeObjectURL(urlFactura);
      setUrlFactura('');
    }

    try {
      setLoading(true);
      
      const facturaDto = await getFacturaById(parseInt(id, 10));

      if (!facturaDto || !facturaDto.UriFactura) {
        throw new Error('Factura no encontrada o URL no disponible.');
      }
      
      const urlSupabase = facturaDto.UriFactura;

      // Descargar el contenido
      const response = await fetch(urlSupabase);

      if (!response.ok) {
        throw new Error(`Error al descargar el documento (${response.status} ${response.statusText}).`);
      }
      
      // Detectar el tipo de contenido
      const contentType = response.headers.get('content-type') || '';
      
      // Si es PDF - REDIRIGIR DIRECTAMENTE
      if (contentType.includes('application/pdf') || urlSupabase.toLowerCase().endsWith('.pdf')) {
        // Redirigir directamente al PDF en lugar de usar iframe
        window.location.href = urlSupabase;
        return;
      }
      
      // Si es HTML (comportamiento original)
      const htmlText = await response.text();
      
      // Verificar si realmente es HTML
      if (htmlText.trim().startsWith('<!DOCTYPE') || htmlText.trim().startsWith('<html')) {
        const blob = new Blob([htmlText], { type: 'text/html' });
        const localUrl = URL.createObjectURL(blob);
        setTipoDato('html');
        setUrlFactura(localUrl);
      } else {
        // Si no es HTML ni PDF reconocible, intentar como HTML de todos modos
        const blob = new Blob([htmlText], { type: 'text/html' });
        const localUrl = URL.createObjectURL(blob);
        setTipoDato('html');
        setUrlFactura(localUrl);
      }
      
      setLoading(false);

    } catch (err) {
      console.error('Error cargando factura:', err);
      setError(err.message || 'Error al conectar con el servicio.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <h2>⏳ Cargando factura...</h2>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <div style={styles.errorIcon}>⚠️</div>
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => window.history.back()} style={styles.button}>
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.iframeContainer}>
      <iframe
        src={urlFactura}
        style={styles.iframe}
        title="Factura"
        frameBorder="0"
        sandbox="allow-same-origin allow-scripts"
      />
      {tipoDato === 'pdf' && (
        <div style={styles.pdfHint}>
          📄 Visualizando PDF | Si no se muestra, <a href={urlFactura} target="_blank" rel="noopener noreferrer" style={styles.link}>descargar aquí</a>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#ffffff',          // FONDO BLANCO
    padding: '20px'
  },

  loading: {
    textAlign: 'center',
    color: '#444',
    fontFamily: 'Poppins, sans-serif'
  },

  spinner: {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    background: 'conic-gradient(#d1d5db, #9ca3af, #6b7280, #d1d5db)',  // Grises suaves
    mask: 'radial-gradient(circle, transparent 40%, black 41%)',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },

  error: {
    background: '#ffffff',
    padding: '40px 35px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '460px',
    fontFamily: 'Poppins, sans-serif',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
  },

  errorIcon: {
    fontSize: '70px',
    marginBottom: '10px',
    color: '#ef4444'  // rojo elegante
  },

  button: {
    marginTop: '25px',
    padding: '12px 28px',
    background: '#4b5563', // gris oscuro elegante
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px',
    fontFamily: 'Poppins, sans-serif',
    transition: '0.2s',
  },

  iframeContainer: {
    width: '100%',
    height: '100vh',
    padding: '20px',
    background: '#ffffff'   // FONDO BLANCO
  },

  iframe: {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    background: '#ffffff'
  },

  pdfHint: {
    position: 'absolute',
    bottom: '25px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(60, 60, 60, 0.85)',
    color: 'white',
    padding: '12px 22px',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'Poppins, sans-serif',
    boxShadow: '0 8px 22px rgba(0,0,0,0.12)'
  },

  link: {
    color: '#d1e8ff',
    textDecoration: 'underline',
    fontWeight: '600'
  }
};

export default VisorFacturaIframe;