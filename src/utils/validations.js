// utils/validation.js

/**
 * Valida un nombre o apellido.
 * - Debe contener solo letras (incluyendo acentos).
 * - La primera letra debe ser mayúscula.
 * - No debe contener números.
 * @param {string} value El nombre o apellido a validar.
 * @returns {string | null} El mensaje de error si la validación falla, o null si es exitosa.
 */
export const validateName = (value) => {
    if (!value) {
        return "Este campo es obligatorio.";
    }

    // Expresión regular para verificar si solo contiene letras y espacios, y no números.
    // También incluye caracteres acentuados y la ñ/Ñ.
    const lettersOnly = /^[a-zA-Z\u00C0-\u017F\s'-]+$/;
    if (!lettersOnly.test(value)) {
        return "Solo se permiten letras y espacios.";
    }

    // Expresión regular para verificar que la primera letra sea mayúscula.
    // ^[A-Z\u00C0-\u017F] - debe empezar con una mayúscula (incluyendo letras acentuadas).
    const startsWithCapital = /^[A-Z\u00C0-\u017F]/;
    if (!startsWithCapital.test(value)) {
        return "Debe comenzar con una letra mayúscula.";
    }

    return null; // Éxito
};

/**
 * Valida una contraseña con altos estándares de seguridad.
 * - Mínimo 8 caracteres.
 * - Al menos una letra mayúscula.
 * - Al menos una letra minúscula.
 * - Al menos un número.
 * - Al menos un carácter especial (ej. !@#$%^&*)
 * @param {string} value La contraseña a validar.
 * @returns {string | null} El mensaje de error si la validación falla, o null si es exitosa.
 */
export const validatePassword = (value) => {
    if (!value) {
        return "La contraseña es obligatoria.";
    }

    // Mínimo 8 caracteres
    if (value.length < 8) {
        return "Debe tener al menos 8 caracteres.";
    }

    // Al menos una mayúscula, minúscula, número, y carácter especial.
    const requirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
    
    if (!requirements.test(value)) {
        return "Debe contener: mayúscula, minúscula, número y un carácter especial.";
    }

    return null; // Éxito
};

/**
 * Valida un formato de correo electrónico básico.
 * @param {string} value El correo a validar.
 * @returns {string | null} El mensaje de error si la validación falla, o null si es exitosa.
 */
// En tu archivo '../../utils/validations.js'

// En tu archivo '../../utils/validations.js'

export const validateEmail = (email) => {
    if (!email) {
        return 'El correo es obligatorio.';
    }

    // NUEVO REGEX: 
    // ^[^\s@]+@([^\s@]+\.)+[a-zA-Z]{2,7}$
    // [a-zA-Z]{2,7}: Fuerza a que la extensión final solo contenga letras (alfabético), de 2 a 7 caracteres.
    
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[a-zA-Z]{2,7}$/;

    if (!emailRegex.test(email)) {
        return 'Por favor ingresa un correo con formato válido (ej: usuario@dominio.com).';
    }

    return null;
};
/**
 * Valida el campo de documento (Cédula o Pasaporte).
 * Esta es una validación simple de que el campo no esté vacío.
 * Puedes agregar validaciones de formato específicas de tu país si las necesitas.
 * @param {string} value El número de documento a validar.
 * @returns {string | null} El mensaje de error si la validación falla, o null si es exitosa.
 */
export const validateDocument = (value) => {
    if (!value) {
        return "El número de documento (Cédula/Pasaporte) es obligatorio.";
    }
    // Opcional: podrías agregar validaciones de longitud o formato aquí,
    // por ejemplo: if (value.length < 5 || value.length > 15) { ... }

    return null; // Éxito
};

/**
 * Valida que la edad esté en el rango de 18 a 70 años.
 * @param {number | string} value La edad a validar.
 * @returns {string | null} El mensaje de error si la validación falla, o null si es exitosa.
 */
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

    return null; // Éxito
};