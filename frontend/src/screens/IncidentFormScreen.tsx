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
import { cityBackground } from '../assets/images';
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
  const { dialog, error, success, close } = useDialog();
  const isEdit = mode === 'edit';
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; name: string }[]
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

      for (const image of evidence) {
        const attachResult = await attachEvidenceToIncident(incident.id, image);
        if (!attachResult.success) {
          failedCount += 1;
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
          message: 'El reporte se registró, pero ninguna imagen pudo subirse. Intenta adjuntarlas después.',
        });
        return;
      }

      success({
        title: 'Reporte registrado',
        message:
          failedCount > 0
            ? `${evidence.length - failedCount} de ${evidence.length} imágenes se adjuntaron correctamente; ${failedCount} no pudieron subirse.`
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
    <View style={styles.root}>
      <ImageBackground source={cityBackground} style={styles.flex} resizeMode="cover">
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.96)',
            'rgba(5, 14, 26, 0.92)',
            'rgba(3, 9, 18, 0.97)',
          ]}
        />
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />

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
                onBack={onBack}
              />

              <View style={styles.pageHeader}>
                <View style={styles.pageIconWrap}>
                  <Icon name="report" size={28} color={Colors.accent} />
                </View>
                <View style={styles.pageHeaderText}>
                  <Text style={styles.pageTitle}>
                    {isEdit ? 'Editar incidente' : 'Registrar incidente'}
                  </Text>
                  <Text style={styles.pageSubtitle}>
                    {isEdit
                      ? 'Actualiza los datos de tu reporte. Solo puedes editarlo una vez.'
                      : 'Describe el problema y presiona enviar.'}
                  </Text>
                </View>
              </View>

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
                      pressed && styles.pickerPressed,
                    ]}
                    onPress={() => setPickOpen(true)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        !selectedCategory && styles.pickerPlaceholder,
                      ]}
                    >
                      {selectedCategory
                        ? selectedCategory.name
                        : 'Selecciona una categoría'}
                    </Text>
                    <Icon name="chevronDown" size={18} color={Colors.textMuted} />
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
                  />
                </View>
              </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

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
            <Text style={styles.modalTitle}>Selecciona una categoría</Text>
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
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    {selected ? (
                      <Icon name="check" size={18} color={Colors.accent} />
                    ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  flex: { flex: 1 },
  bg: {
    ...StyleSheet.absoluteFill,
  },
  orbTL: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
    top: -50,
    left: -50,
  },
  orbBR: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 232, 150, 0.04)',
    bottom: 150,
    right: -40,
  },
  content: {
    padding: spacing.base,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
    paddingTop: spacing.sm,
  },
  pageIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1.5,
    borderColor: Colors.accent + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeaderText: { flex: 1 },
  pageTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: 'rgba(7, 22, 36, 0.88)',
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
    overflow: 'hidden',
  },
  cardTopBar: {
    height: 3,
    backgroundColor: Colors.accent,
  },
  cardBody: {
    padding: spacing.base,
  },
  label: {
    color: Colors.textMuted,
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
    backgroundColor: 'rgba(3, 12, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    borderRadius: radius.element,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  pickerPressed: {
    borderColor: Colors.accent,
  },
  pickerText: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
  },
  pickerPlaceholder: {
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
  },
  editNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderColor: 'rgba(0, 212, 255, 0.25)',
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
    backgroundColor: 'rgba(10, 26, 42, 0.98)',
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.22)',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    maxHeight: '62%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
    marginBottom: spacing.base,
  },
  modalTitle: {
    color: Colors.textOnDark,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.base,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.element,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
  modalItemPressed: {
    opacity: 0.7,
  },
  modalItemText: {
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    flex: 1,
  },
  modalEmpty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: Colors.textMuted,
    fontSize: fontSizes.caption,
  },
});
