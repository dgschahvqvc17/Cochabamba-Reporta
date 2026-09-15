/**
 * Pantalla: Formulario de incidente (MVC - View).
 *
 * HU06 — Registro de incidentes por parte del ciudadano.
 * Replica el patrón visual de CategoryFormScreen (dark immersive,
 * glassmorphic form card, conceptos y animaciones), añadiendo un
 * selector de categoría (obligatoria) alimentado por categoryController.
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
import GradientOverlay from '../components/GradientOverlay';
import Icon from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { cityBackground } from '../assets/images';
import { registerIncident } from '../controllers/incidentController';
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

type IncidentFormScreenProps = {
  onBack: () => void;
  onSaved: () => void;
};

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 120;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 2000;

type FieldErrors = Record<string, string>;

export default function IncidentFormScreen({
  onBack,
  onSaved,
}: IncidentFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, error, success, close } = useDialog();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; name: string }[]
  >([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (categoryId === null) return;

    setIsSubmitting(true);
    const result = await registerIncident({
      categoryId,
      title: title.trim(),
      description: description.trim(),
    });
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      error({
        title: 'No se pudo registrar el reporte',
        message: result.message,
      });
      return;
    }

    success({
      title: 'Reporte registrado',
      message: 'Tu incidente se registró correctamente y está en revisión.',
      onAccept: onSaved,
    });
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
              <AdminHeader title="Nuevo reporte" onBack={onBack} />

              <View style={styles.pageHeader}>
                <View style={styles.pageIconWrap}>
                  <Icon name="report" size={28} color={Colors.accent} />
                </View>
                <View style={styles.pageHeaderText}>
                  <Text style={styles.pageTitle}>Registrar incidente</Text>
                  <Text style={styles.pageSubtitle}>
                    Describe el problema y presiona enviar.
                  </Text>
                </View>
              </View>

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

                  <PrimaryButton
                    label={isSubmitting ? 'Registrando…' : 'Enviar reporte'}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                  />
                </View>
              </View>
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
