/**
 * Servicio de usuarios duplicados (MVC - Service).
 *
 * Evita que una misma persona tenga dos cuentas, más allá del correo (único
 * en la base) y del documento de identidad. Una persona es la misma cuando
 * coinciden sus nombres y además el teléfono o el documento: así dos
 * personas distintas que comparten nombre ("Juan Pérez") no se bloquean,
 * pero el mismo ciudadano que se registra otra vez con otro correo no
 * puede.
 *
 * Se usa en el registro del ciudadano (auth.service) y en la alta de
 * funcionarios (user.service).
 *
 * @format
 */

'use strict';

const userRepository = require('../repositories/user.repository');
const { buildError } = require('../utils/errors');
const { normalizeForCompare } = require('../utils/text');

const DUPLICATE_MESSAGE =
  'Ya existe una cuenta registrada con estos datos personales. Si ya tienes una cuenta, inicia sesión; si no, revisa tu nombre, apellido y teléfono.';

const sameValue = (left, right) => {
  const a = normalizeForCompare(left);
  const b = normalizeForCompare(right);

  return a !== '' && a === b;
};

/**
 * Lanza un error 409 si los datos identifican a una persona que ya tiene
 * cuenta. `excludeUserId` permite usar la misma función al editar un usuario
 * (para que no se detecte a sí mismo).
 */
const userDuplicatesService = {
  async assertNotDuplicatePerson({
    firstName,
    lastName,
    phone,
    identityNumber,
    excludeUserId,
  }) {
    const candidates = await userRepository.findSameNameCandidates({
      firstName,
      lastName,
      excludeId: excludeUserId,
    });

    if (candidates.length === 0) {
      return;
    }

    const duplicated = candidates.some((candidate) => {
      const sameName =
        sameValue(candidate.first_name, firstName) &&
        sameValue(candidate.last_name, lastName);

      if (!sameName) {
        return false;
      }

      return (
        sameValue(candidate.phone, phone) ||
        sameValue(candidate.identity_number, identityNumber)
      );
    });

    if (duplicated) {
      throw buildError(DUPLICATE_MESSAGE, 409, 'DUPLICATE_USER');
    }
  },
};

module.exports = userDuplicatesService;
