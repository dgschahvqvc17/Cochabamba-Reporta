/**
 * Validaciones del registro de ciudadano (HU01).
 *
 * Reglas aplicadas conforme a los criterios de aceptación:
 *   - Campos obligatorios completos.
 *   - Formato de correo electrónico.
 *   - Formato de teléfono.
 *   - Fecha de nacimiento válida.
 *   - Documento de identidad con formato válido.
 *   - Contraseñas coinciden y con longitud mínima.
 *
 * @format
 */

'use strict';

const { body } = require('express-validator');

const MIN_PASSWORD_LENGTH = 8;

const validateFirstName = body('firstName')
  .trim()
  .notEmpty()
  .withMessage('El nombre es obligatorio.')
  .isLength({ max: 100 })
  .withMessage('El nombre no debe superar los 100 caracteres.');

const validateLastName = body('lastName')
  .trim()
  .notEmpty()
  .withMessage('El apellido es obligatorio.')
  .isLength({ max: 100 })
  .withMessage('El apellido no debe superar los 100 caracteres.');

const validateBirthDate = body('birthDate')
  .trim()
  .notEmpty()
  .withMessage('La fecha de nacimiento es obligatoria.')
  .matches(/^\d{4}-\d{2}-\d{2}$/)
  .withMessage('La fecha de nacimiento debe tener el formato AAAA-MM-DD.')
  .custom((value) => {
    const birthDate = new Date(value);
    const now = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      throw new Error('La fecha de nacimiento no es válida.');
    }

    if (birthDate >= now) {
      throw new Error('La fecha de nacimiento debe ser anterior a hoy.');
    }

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18);

    if (birthDate > minDate) {
      throw new Error('Debes ser mayor de edad (18 años) para registrarte.');
    }

    return true;
  });

const validateIdentityNumber = body('identityNumber')
  .trim()
  .notEmpty()
  .withMessage('El número de documento de identidad es obligatorio.')
  .matches(/^\d{5,8}$/)
  .withMessage('El documento de identidad debe contener entre 5 y 8 dígitos.');

const validatePhone = body('phone')
  .trim()
  .notEmpty()
  .withMessage('El número de teléfono es obligatorio.')
  .matches(/^\d{7,8}$/)
  .withMessage('El número de teléfono debe contener entre 7 y 8 dígitos.');

const validateEmail = body('email')
  .trim()
  .notEmpty()
  .withMessage('El correo electrónico es obligatorio.')
  .isEmail()
  .withMessage('El correo electrónico no tiene un formato válido.')
  .isLength({ max: 150 })
  .withMessage('El correo electrónico no debe superar los 150 caracteres.');

const validatePassword = body('password')
  .notEmpty()
  .withMessage('La contraseña es obligatoria.')
  .isLength({ min: MIN_PASSWORD_LENGTH })
  .withMessage(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);

const validateConfirmPassword = body('confirmPassword').custom((value, { req }) => {
  if (value !== req.body.password) {
    throw new Error('Las contraseñas no coinciden.');
  }

  return true;
});

const validateAddress = body('address')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 200 })
  .withMessage('La dirección no debe superar los 200 caracteres.');

const validateLoginEmail = body('email')
  .trim()
  .notEmpty()
  .withMessage('El correo electrónico es obligatorio.')
  .isEmail()
  .withMessage('El correo electrónico no tiene un formato válido.')
  .isLength({ max: 150 })
  .withMessage('El correo electrónico no debe superar los 150 caracteres.');

const validateLoginPassword = body('password')
  .notEmpty()
  .withMessage('La contraseña es obligatoria.');

const loginValidation = [validateLoginEmail, validateLoginPassword];

const registerValidation = [
  validateFirstName,
  validateLastName,
  validateBirthDate,
  validateIdentityNumber,
  validatePhone,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateAddress,
];

module.exports = {
  registerValidation,
  loginValidation,
  MIN_PASSWORD_LENGTH,
};