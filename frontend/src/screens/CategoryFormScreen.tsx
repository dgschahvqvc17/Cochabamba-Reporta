/**
 * Pantalla: Formulario de categoría (MVC - View).
 *
 * HU04 — Dark immersive layout con cityBackground + overlay multicapa,
 * glassmorphic form card, inputs modo dark y header oscuro consistente.
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import {
  createCategory,
  editCategory,
  loadCategories,
  type FieldErrors,
} from '../controllers/categoryController';
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

type CategoryFormScreenProps = {
  mode: 'create' | 'edit';
  categoryId?: number;
  onBack: () => void;
  onSaved: () => void;
};

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;

function CategoryFormScreen({
  mode,
  categoryId,
  onBack,
  onSaved,
}: CategoryFormScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, info, close } = useDialog();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isEdit || categoryId === undefined) return;
    (async () => {
      const result = await loadCategories();
      if (!result.success) {
        setLoadError(result.message);
        setIsLoading(false);
        return;
      }
      const cat = result.data?.categories.find((c) => c.id === categoryId);
      if (!cat) {
        setLoadError('La categoría no existe.');
        setIsLoading(false);
        return;
      }
      setName(cat.name);
      setDescription(cat.description ?? '');
      setIsLoading(false);
    })();
  }, [isEdit, categoryId]);

  const validateForm = (): FieldErrors => {
    const errs: FieldErrors = {};
    const trimmed = name.trim();
    if (!trimmed) errs.name = 'El nombre de la categoría es obligatorio.';
    else if (trimmed.length < MIN_NAME_LENGTH) errs.name = `Mínimo ${MIN_NAME_LENGTH} caracteres.`;
    else if (trimmed.length > MAX_NAME_LENGTH) errs.name = `Máximo ${MAX_NAME_LENGTH} caracteres.`;
    if (description.trim().length > MAX_DESCRIPTION_LENGTH)
      errs.description = `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`;
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    const payload = { name: name.trim(), description: description.trim() || undefined };
    const result =
      isEdit && categoryId !== undefined
        ? await editCategory(categoryId, payload)
        : await createCategory(payload);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors);
      info({
        title: isEdit ? 'No se pudo actualizar' : 'No se pudo registrar',
        message: result.message,
      });
      return;
    }

    info({
      title: isEdit ? 'Categoría actualizada' : 'Categoría registrada',
      message: isEdit
        ? 'La categoría se actualizó correctamente.'
        : 'La categoría se registró correctamente.',
      onAccept: onSaved,
    });
  };

  // ── Loading / Error states ─────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Editar categoría" onBack={onBack} />
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.centerText}>Cargando categoría…</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <AdminHeader title="Editar categoría" onBack={onBack} />
        <View style={styles.centerBox}>
          <Icon name="warning" size={36} color={Colors.danger} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Dark immersive background */}
      <ImageBackground
        source={cityBackground}
        style={styles.bg}
        resizeMode="cover"
      >
        <GradientOverlay
          colors={[
            'rgba(4, 9, 18, 0.96)',
            'rgba(5, 14, 26, 0.92)',
            'rgba(3, 9, 18, 0.97)',
          ]}
        />
        {/* Decorative orbs */}
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />
      </ImageBackground>

      {/* Header (sits on top of bg) */}
      <AdminHeader
        title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
        subtitle={isEdit ? name : 'Registrar categoría de incidente'}
        onBack={onBack}
      />

      {/* Scrollable form */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.huge },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Page header block */}
          <View style={styles.pageHeader}>
            <View style={styles.pageIconWrap}>
              <Icon name={isEdit ? 'edit' : 'plus'} size={28} color={Colors.accent} />
            </View>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>
                {isEdit ? 'Editar categoría' : 'Nueva categoría'}
              </Text>
              <Text style={styles.pageSubtitle}>
                Las categorías permiten clasificar los incidentes reportados por ciudadanos.
              </Text>
            </View>
          </View>

          {/* Glassmorphic form card */}
          <View style={styles.formCard}>
            <View style={styles.cardTopBar} />

            <View style={styles.cardBody}>
              <AppTextInput
                label="Nombre *"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setErrors((c) => { const n = { ...c }; delete n.name; return n; });
                }}
                placeholder="Ej. Residuos, Baches, Alumbrado..."
                maxLength={MAX_NAME_LENGTH}
                autoCapitalize="sentences"
                error={errors.name}
                icon="category"
                dark
              />

              <AppTextInput
                label="Descripción"
                value={description}
                onChangeText={(v) => {
                  setDescription(v);
                  setErrors((c) => { const n = { ...c }; delete n.description; return n; });
                }}
                placeholder="Describe qué tipo de incidentes incluye."
                maxLength={MAX_DESCRIPTION_LENGTH}
                error={errors.description}
                hint={`${description.length} / ${MAX_DESCRIPTION_LENGTH} caracteres`}
                dark
              />

              <PrimaryButton
                label={isEdit ? 'Guardar cambios' : 'Registrar categoría'}
                onPress={handleSubmit}
                loading={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  flex: { flex: 1 },
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.base,
  },
  centerText: {
    color: Colors.textMuted,
    fontSize: fontSizes.body,
  },
  errorText: {
    color: Colors.danger,
    fontSize: fontSizes.body,
    textAlign: 'center',
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
  // section label (unused here but kept for consistency)
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
});

export default CategoryFormScreen;
