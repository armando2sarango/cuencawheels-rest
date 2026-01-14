export const validateName = (value) => {
    if (!value) {
        return "Este campo es obligatorio.";
    }
    const lettersOnly = /^[a-zA-Z\u00C0-\u017F\s'-]+$/;
    if (!lettersOnly.test(value)) {
        return "Solo se permiten letras y espacios.";
    }
    const startsWithCapital = /^[A-Z\u00C0-\u017F]/;
    if (!startsWithCapital.test(value)) {
        return "Debe comenzar con una letra mayúscula.";
    }

    return null; // Éxito
};

export const validatePassword = (value) => {
    if (!value) {
        return "La contraseña es obligatoria.";
    }
    if (value.length < 8) {
        return "Debe tener al menos 8 caracteres.";
    }
    const requirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
    
    if (!requirements.test(value)) {
        return "Debe contener: mayúscula, minúscula, número y un carácter especial.";
    }

    return null; // Éxito
};

export const validateEmail = (email) => {
    if (!email) {
        return 'El correo es obligatorio.';
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[a-zA-Z]{2,7}$/;

    if (!emailRegex.test(email)) {
        return 'Por favor ingresa un correo con formato válido (ej: usuario@dominio.com).';
    }

    return null;
};
export const validateDocument = (value) => {
    if (!value) {
        return "El número de documento (Cédula/Pasaporte) es obligatorio.";
    }

    return null; 
};

export const validateAge = (value) => {
    const age = parseInt(value, 10);

    if (isNaN(age)) {
        return "La edad es obligatoria y debe ser un número.";
    }

    if (age < 18) {
        return "Debes ser mayor de 18 años.";
    }

    if (age > 70) {
        return "La edad máxima permitida es 70 años.";
    }

    return null; 
};
export const validatePlate = (value) => {
    if (!value) {
        return "La placa del vehículo es obligatoria.";
    }
    const plate = value.toUpperCase();
    const plateRegex = /^[A-Z]{3}-\d{3,4}$/;

    if (!plateRegex.test(plate)) {
        return "Formato inválido. Ejemplo válido: ABC-1234";
    }
    return null; 
};
export const validateModelo = (value) => {
  if (!value) return "El modelo es obligatorio";
  const regex = /^[A-Za-z0-9\s-]{2,30}$/;
  if (!regex.test(value)) {
    return "Modelo inválido";
  }
  return null;
};
export const validateAnio = (value) => {
  const year = Number(value);
  const currentYear = new Date().getFullYear() + 1;

  if (!year) return "El año es obligatorio";
  if (year < 1980 || year > currentYear) {
    return `El año debe estar entre 1980 y ${currentYear}`;
  }

  return null;
};
export const validatePrecio = (value) => {
  const price = Number(value);
  if (isNaN(price)) return "Precio inválido";
  if (price <= 0) return "El precio debe ser mayor a 0";

  return null;
};

export const validateImageUrl = (value) => {
  if (!value) {
    return "La imagen es obligatoria";
  }
  try {
    new URL(value);
  } catch {
    return "Debe ser una URL válida";
  }
  return null;
};
