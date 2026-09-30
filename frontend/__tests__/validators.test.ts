/**
 * Pruebas de las validaciones de texto (HU01, HU03, HU06).
 *
 * Verifican que el frontend aplique las mismas reglas que el backend
 * (utils/text.js y utils/userRules.js): letras repetidas, espacios
 * inútiles y límites de longitud de nombre, apellido y dirección.
 */

import {
  MAX_ADDRESS_LENGTH,
  MAX_LAST_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REPEATED_LETTERS_RUN,
  MIN_NAME_LENGTH,
  hasRepeatedLetters,
  repeatedLettersMessage,
  singleSpaced,
  validatePersonName,
} from '../src/utils/validators';

describe('hasRepeatedLetters', () => {
  it('acepta dos letras iguales seguidas porque son normales en español', () => {
    expect(hasRepeatedLetters('Castillo')).toBe(false);
    expect(hasRepeatedLetters('Barrow')).toBe(false);
    expect(hasRepeatedLetters('Pérez Mamani')).toBe(false);
    expect(hasRepeatedLetters('Aaaaa')).toBe(true);
  });

  it('acepta dos seguidas y rechaza tres o más', () => {
    expect(hasRepeatedLetters('ll')).toBe(false);
    expect(hasRepeatedLetters('lloo')).toBe(false);
    expect(hasRepeatedLetters('aaa')).toBe(true);
    expect(hasRepeatedLetters('Bacheaaa en la calle')).toBe(true);
  });

  it('ignora mayúsculas y minúsculas al detectar la serie', () => {
    expect(hasRepeatedLetters('aaA')).toBe(true);
    expect(hasRepeatedLetters('aAa')).toBe(true);
  });

  it('los espacios, guiones y apóstrofos cortan la serie', () => {
    expect(hasRepeatedLetters('Pérez-Villa')).toBe(false);
    expect(hasRepeatedLetters("D'Angelo")).toBe(false);
    expect(hasRepeatedLetters('a aaa')).toBe(true);
  });

  it('acepta tildes, ñ y letras acentuadas', () => {
    expect(hasRepeatedLetters('ñ')).toBe(false);
    expect(hasRepeatedLetters('Á')).toBe(false);
  });
});

describe('singleSpaced', () => {
  it('colapsa los espacios de más sin quitar el espacio final', () => {
    // No recorta: se escribe en vivo y quitar el espacio final impediría
    // empezar la siguiente palabra. El recorte ocurre al validar/enviar.
    expect(singleSpaced('Juan   Perez')).toBe('Juan Perez');
    expect(singleSpaced('Bache  en  la  calle')).toBe('Bache en la calle');
    expect(singleSpaced('Juan ')).toBe('Juan ');
    expect(singleSpaced(' ')).toBe(' ');
  });

  it('respeta los saltos de línea de la descripción', () => {
    expect(singleSpaced('primera  linea\nsegunda   linea')).toBe(
      'primera linea\nsegunda linea',
    );
  });
});

describe('validatePersonName', () => {
  it('exige el campo', () => {
    expect(validatePersonName('', 'El nombre')).toBe('El nombre es obligatorio.');
    expect(validatePersonName('   ', 'El nombre')).toBe('El nombre es obligatorio.');
  });

  it('aplica el límite de longitud con el mismo mensaje del backend', () => {
    // 'Pe' repetido: 40 caracteres sin tres letras iguales seguidas, para
    // que la única regla que pueda fallar sea la longitud.
    const longLastName = 'Pe'.repeat(MAX_LAST_NAME_LENGTH / 2);
    expect(validatePersonName('J', 'El nombre')).toBe(
      `El nombre debe tener entre ${MIN_NAME_LENGTH} y ${MAX_NAME_LENGTH} caracteres.`,
    );
    expect(validatePersonName(`${longLastName}P`, 'El apellido', MAX_LAST_NAME_LENGTH)).toBe(
      `El apellido debe tener entre ${MIN_NAME_LENGTH} y ${MAX_LAST_NAME_LENGTH} caracteres.`,
    );
    expect(validatePersonName(longLastName, 'El apellido', MAX_LAST_NAME_LENGTH)).toBeNull();
  });

  it('rechaza letras repetidas con un mensaje entendible', () => {
    expect(validatePersonName('Juaaan', 'El nombre')).toBe(
      repeatedLettersMessage('El nombre'),
    );
    expect(validatePersonName('Juan', 'El nombre')).toBeNull();
  });
});

describe('constantes compartidas con el backend', () => {
  it('mantienen los mismos límites', () => {
    expect(MAX_REPEATED_LETTERS_RUN).toBe(2);
    expect(MAX_NAME_LENGTH).toBe(30);
    expect(MAX_LAST_NAME_LENGTH).toBe(40);
    expect(MAX_ADDRESS_LENGTH).toBe(200);
  });
});
