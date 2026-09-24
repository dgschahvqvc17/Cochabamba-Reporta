/**
 * Pantalla: Formulario de incidente (MVC - View).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * HU07 — Adjuntar evidencia fotográfica.
 * HU08 — Registrar ubicación del incidente.
 * Replica el patrón visual de CategoryFormScreen (dark immersive,
 * glassmorphic form card, conceptos y animaciones), añadiendo un
 * selector de categoría (obligatoria) alimentado por categoryController,
 * el selector de evidencia fotográfica (opcional, hasta 5 imágenes) y
 * el selector de ubicación (obligatoria, HU08).
 * Al enviar: primero registra el incidente, luego adjunta la ubicación
 * y por último sube cada imagen adjunta a /incidents/:id/evidence.
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminHeader from '../components/AdminHeader';
import AppDialog from '../components/AppDialog';
import AppTextInput from '../components/AppTextInput';
import EvidencePicker from '../components/EvidencePicker';
import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import LocationPicker from '../components/LocationPicker';
import PrimaryButton from '../components/PrimaryButton';
import { fondoNew } from '../assets/images';
import {
  attachEvidenceToIncident,
  attachLocationToIncident,
  captureCurrentLocation,
  editIncident,
  loadIncidentById,
  pickEvidence as pickEvidenceFromSource,
  registerIncident,
} from '../controllers/incidentController';
import { loadCategories } from '../controllers/categoryController';
import { useDialog } from '../hooks/useDialog';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import {
  Colors,
  fontSizes,
  fontWeights,
  layout,
  letterSpacings,
  radius,
  spacing,
} from '../theme';
import type { PickedEvidence } from '../utils/evidence';
import type { CurrentPosition } from '../utils/location';

type IncidentFormScreenProps = {
  onBack: () => void;
  onSaved: () => void;
  mode?: 'create' | 'edit';
  incidentId?: number;
};

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;

type FieldErrors = Record<string, string>;

export default function IncidentFormScreen({
  onBack,
  onSaved,
  mode = 'create',
  incidentId,
}: IncidentFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, error, confirm, success, close } = useDialog();
  const isOnline = useNetworkStatus();
  const isEdit = mode === 'edit';
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; name: string; description?: string | null }[]
  >([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidence, setEvidence] = useState<PickedEvidence[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [position, setPosition] = useState<CurrentPosition | null>(null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(isEdit);

  useEffect(() => {
    (async () => {
      const result = await loadCategories();
      if (result.success && result.data) {
        setCategories(
          result.data.categories
            .filter((c) => c.active)
            .map((c) => ({ id: c.id, name: c.name })),
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || !incidentId) {
      return;
    }

    (async () => {
      const result = await loadIncidentById(incidentId);
      setIsLoadingEdit(false);

      if (!result.success || !result.data) {
        error({
          title: 'No se pudo cargar el reporte',
          message: result.message,
          onAccept: onBack,
        });
        return;
      }

      const incident = result.data;
      setCategoryId(incident.categoryId);
      setTitle(incident.title);
      setDescription(incident.description);
    })();
  }, [isEdit, incidentId, error, onBack]);

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!categoryId) {
      errs.categoryId = 'Debes seleccionar una categoría.';
    }
    const t = title.trim();
    if (!t) errs.title = 'El título es obligatorio.';
    else if (t.length < MIN_TITLE_LENGTH)
      errs.title = `Mínimo ${MIN_TITLE_LENGTH} caracteres.`;
    else if (t.length > MAX_TITLE_LENGTH)
      errs.title = `Máximo ${MAX_TITLE_LENGTH} caracteres.`;
    const d = description.trim();
    if (!d) errs.description = 'La descripción es obligatoria.';
    else if (d.length < MIN_DESCRIPTION_LENGTH)
      errs.description = `Mínimo ${MIN_DESCRIPTION_LENGTH} caracteres.`;
    else if (d.length > MAX_DESCRIPTION_LENGTH)
      errs.description = `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    if (!isEdit && !position) {
      errs.location = 'Debes registrar la ubicación del incidente.';
    }
    if (!isEdit && evidence.length === 0) {
      errs.evidence =
        'Debes adjuntar al menos una evidencia fotográfica para enviar el reporte.';
    }
    return errs;
  };

  const handleCaptureLocation = async () => {
    if (isLocating) return;

    setIsLocating(true);
    const result = await captureCurrentLocation();
    setIsLocating(false);

    if (!result.ok || !result.position) {
      error({
        title: 'Ubicación no disponible',
        message: result.message ?? 'No se pudo obtener tu ubicación.',
      });
      return;
    }

    setPosition(result.position);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      return next;
    });
  };

  const handleClearLocation = () => {
    setPosition(null);
    setAddress('');
  };

  const hasDraft =
    categoryId !== null ||
    title.trim().length > 0 ||
    description.trim().length > 0 ||
    evidence.length > 0 ||
    position !== null ||
    address.trim().length > 0;

  const handleBack = () => {
    if (!isOnline && hasDraft) {
      confirm({
        title: 'Sin conexión a internet',
        message:
          'Estás elaborando un reporte sin conexión. Si sales ahora, los datos que ingresaste se perderán porque aún no se guardaron.',
        confirmLabel: 'Salir de todos modos',
        cancelLabel: 'Seguir en el formulario',
        tone: 'warning',
        onConfirm: onBack,
      });
      return;
    }

    onBack();
  };

  const handleAddEvidence = async (source: 'camera' | 'gallery') => {
    if (isPicking) return;

    setIsPicking(true);
    const result = await pickEvidenceFromSource(source);
    setIsPicking(false);

    if (result.cancelled) {
      return;
    }

    if (!result.ok || !result.evidence) {
      error({
        title: 'Imagen no disponible',
        message: result.message ?? 'No se pudo obtener la imagen.',
      });
      return;
    }

    setEvidence((current) => [...current, result.evidence as PickedEvidence]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.evidence;
      return next;
    });
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (categoryId === null) return;

    setIsSubmitting(true);

    try {
      const payload = {
        categoryId,
        title: title.trim(),
        description: description.trim(),
      };

      if (isEdit) {
        if (!incidentId) {
          error({
            title: 'No se pudo editar el reporte',
            message: 'Falta el identificador del reporte a editar.',
          });
          return;
        }

        const result = await editIncident(incidentId, payload);

        if (!result.success) {
          if (result.fieldErrors) setErrors(result.fieldErrors);
          error({
            title: 'No se pudo editar el reporte',
            message: result.message,
          });
          return;
        }

        success({
          title: 'Reporte editado',
          message:
            'Tu reporte se actualizó correctamente. Recuerda que solo se permite una edición.',
          onAccept: onSaved,
        });
        return;
      }

      const result = await registerIncident(payload);

      if (!result.success || !result.data) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        error({
          title: 'No se pudo registrar el reporte',
          message: result.message,
        });
        return;
      }

      const incident = result.data;
      let locationFailed = false;

      if (position) {
        const locationResult = await attachLocationToIncident(incident.id, {
          latitude: position.latitude,
          longitude: position.longitude,
          address: address.trim() || undefined,
          capturedAt: position.capturedAt,
        });
        locationFailed = !locationResult.success;
      }

      let failedCount = 0;
      let firstEvidenceError = '';

      for (const image of evidence) {
        const attachResult = await attachEvidenceToIncident(incident.id, image);
        if (!attachResult.success) {
          failedCount += 1;
          if (!firstEvidenceError) {
            firstEvidenceError = attachResult.message;
          }
        }
      }

      if (locationFailed) {
        const evidencePart =
          evidence.length > 0 && failedCount === evidence.length
            ? 'Tampoco pudieron subirse las imágenes adjuntadas.'
            : evidence.length > 0
            ? 'Las imágenes se adjuntaron correctamente.'
            : '';
        error({
          title: 'No se pudo registrar la ubicación',
          message: `El reporte se registró correctamente, pero no se pudo guardar la ubicación del incidente. ${evidencePart} Puedes intentar actualizarla después.`,
        });
        return;
      }

      if (evidence.length > 0 && failedCount === evidence.length) {
        error({
          title: 'No se pudo adjuntar la evidencia',
          message: `El reporte se registró, pero ninguna imagen pudo subirse.${
            firstEvidenceError ? ` Motivo: ${firstEvidenceError}` : ''
          } Puedes intentar adjuntarlas nuevamente.`,
        });
        return;
      }

      success({
        title: 'Reporte registrado',
        message:
          failedCount > 0
            ? `${evidence.length - failedCount} de ${evidence.length} imágenes se adjuntaron correctamente; ${failedCount} no pudieron subirse${
                firstEvidenceError ? ` (${firstEvidenceError})` : '.'
              }`
            : 'Tu incidente se registró correctamente y está en revisión.',
        onAccept: onSaved,
      });
    } catch (caught) {
      error({
        title: 'Error inesperado',
        message:
          caught instanceof Error && caught.message
            ? caught.message
            : 'Ocurrió un error al enviar el reporte. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <ImageBackground
      source={fondoNew}
      style={styles.root}
      resizeMode="cover"
    >
      {/* Degradé institucional: garantiza contraste sobre la foto de fondo */}
      <GradientOverlay
        colors={[
          'rgba(4, 18, 33, 0.88)',
          'rgba(7, 32, 56, 0.82)',
          'rgba(4, 18, 33, 0.92)',
        ]}
      />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={{
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.xxl,
            }}
          >
            <View style={styles.content}>
              <AdminHeader
                title={isEdit ? 'Editar reporte' : 'Nuevo reporte'}
                subtitle={
                  isEdit
                    ? 'Actualiza los datos de tu reporte. Solo puedes editarlo una vez.'
                    : 'Describe el problema y presiona enviar.'
                }
                onBack={handleBack}
                overlay
              />

              {isLoadingEdit ? (
                <View style={styles.loadingEditBox}>
                  <ActivityIndicator color={Colors.accent} size="large" />
                  <Text style={styles.loadingEditText}>
                    Cargando reporte…
                  </Text>
                </View>
              ) : (
              <View style={styles.formCard}>
                <View style={styles.cardTopBar} />
                <View style={styles.cardBody}>
                  {/* Categoría */}
                  <Text style={styles.label}>Categoría</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.picker,
                      selectedCategory && styles.pickerSelected,
                      pressed && styles.pickerPressed,
                    ]}
                    onPress={() => setPickOpen(true)}
                  >
                    <View style={styles.pickerValue}>
                      <Icon
                        name="category"
                        size={20}
                        color={
                          selectedCategory
                            ? Colors.accentDim
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.pickerText,
                          !selectedCategory && styles.pickerPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {selectedCategory
                          ? selectedCategory.name
                          : 'Selecciona una categoría'}
                      </Text>
                    </View>
                    <View style={styles.pickerChevron}>
                      <Icon
                        name="chevronDown"
                        size={18}
                        color={Colors.accentDim}
                      />
                    </View>
                  </Pressable>
                  {errors.categoryId ? (
                    <Text style={styles.errorText}>{errors.categoryId}</Text>
                  ) : null}

                  {/* Título */}
                  <AppTextInput
                    label="Título"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ej.: Bache en la Av. Principal"
                    maxLength={MAX_TITLE_LENGTH}
                    error={errors.title}
                  />

                  {/* Descripción */}
                  <AppTextInput
                    label="Descripción"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe con detalle qué está ocurriendo…"
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    error={errors.description}
                    style={{ minHeight: 120 }}
                  />

                  {/* Evidencia fotográfica y ubicación solo al crear */}
                  {isEdit ? (
                    <View style={styles.editNoteBox}>
                      <Icon name="info" size={18} color={Colors.accent} />
                      <Text style={styles.editNoteText}>
                        La evidencia fotográfica y la ubicación de este reporte
                        se conservan tal como las registraste.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <EvidencePicker
                        evidence={evidence}
                        onAdd={handleAddEvidence}
                        onRemove={handleRemoveEvidence}
                        picking={isPicking}
                        error={errors.evidence}
                      />

                      <LocationPicker
                        position={position}
                        address={address}
                        onCapture={handleCaptureLocation}
                        onClear={handleClearLocation}
                        onChangeAddress={setAddress}
                        locating={isLocating}
                        error={errors.location}
                      />
                    </>
                  )}

                  <PrimaryButton
                    label={
                      isSubmitting
                        ? isEdit
                          ? 'Guardando…'
                          : 'Registrando…'
                        : isEdit
                        ? 'Guardar cambios'
                        : 'Enviar reporte'
                    }
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={
                      !isEdit && evidence.length === 0 && !isSubmitting
                    }
                  />
                </View>
              </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      {/* Selector de categoría */}
      <Modal
        visible={pickOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderIcon}>
                <Icon name="category" size={20} color={Colors.accentDim} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                <Text style={styles.modalSubtitle}>
                  Elige la categoría que mejor describe el reporte.
                </Text>
              </View>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => {
                const selected = item.id === categoryId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalItem,
                      selected && styles.modalItemSelected,
                      pressed && styles.modalItemPressed,
                    ]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.categoryId;
                        return next;
                      });
                      setPickOpen(false);
                    }}
                  >
                    <View
                      style={[
                        styles.modalItemIcon,
                        selected && styles.modalItemIconSelected,
                      ]}
                    >
                      <Icon
                        name={selected ? 'check' : 'category'}
                        size={18}
                        color={
                          selected ? Colors.textOnPrimary : Colors.accentDim
                        }
                      />
                    </View>
                    <View style={styles.modalItemBody}>
                      <Text
                        style={[
                          styles.modalItemText,
                          selected && styles.modalItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text style={styles.modalItemDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                    {categories.length === 0
                      ? 'Cargando categorías…'
                      : 'No hay categorías disponibles.'}
                  </Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      <AppDialog dialog={dialog} onCancel={close} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: { flex: 1, backgroundColor: 'transparent' },


  content: {
    padding: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(140, 175, 205, 0.45)',
    overflow: 'hidden',
    // boxShadow replaces deprecated shadow* props
    // @ts-ignore — web only
    boxShadow: '0 30px 60px -28px rgba(1, 8, 16, 0.85)',
  },
  cardTopBar: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  cardBody: {
    padding: spacing.base,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minHeight: 56,
    gap: spacing.sm,
  },
  pickerSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(59, 130, 184, 0.06)',
  },
  pickerPressed: {
    borderColor: Colors.accent,
  },
  pickerValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
  },
  pickerPlaceholder: {
    color: Colors.textSecondary,
  },
  pickerChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 184, 0.10)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
  },
  loadingEditBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loadingEditText: {
    color: 'rgba(232, 240, 248, 0.92)',
    fontSize: fontSizes.body,
  },
  editNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(59, 130, 184, 0.08)',
    borderColor: 'rgba(59, 130, 184, 0.25)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.base,
    marginTop: spacing.base,
  },
  editNoteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 12, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    maxHeight: '62%',
    // @ts-ignore — web only
    boxShadow: '0 -24px 60px -24px rgba(2, 10, 18, 0.65)',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(87, 103, 122, 0.45)',
    marginBottom: spacing.sm,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.element,
    backgroundColor: 'rgba(59, 130, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    marginTop: 2,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.element,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.surfaceSubtle,
  },
  modalItemSelected: {
    backgroundColor: 'rgba(59, 130, 184, 0.10)',
    borderColor: 'rgba(59, 130, 184, 0.35)',
  },
  modalItemPressed: {
    backgroundColor: 'rgba(59, 130, 184, 0.16)',
  },
  modalItemIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 184, 0.12)',
  },
  modalItemIconSelected: {
    backgroundColor: Colors.accentDim,
  },
  modalItemBody: {
    flex: 1,
  },
  modalItemText: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  modalItemTextSelected: {
    color: Colors.accentDim,
  },
  modalItemDesc: {
    color: Colors.textSecondary,
    fontSize: fontSizes.micro,
    marginTop: 2,
    lineHeight: 15,
  },
  modalEmpty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
  },
});
