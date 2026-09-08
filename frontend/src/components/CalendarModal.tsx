/**
 * Componente compartido: Calendario para elegir fecha (MVC - componentes).
 *
 * Selector de fecha tipo calendario con:
 *   - Navegación por meses (‹ ›) y por años (« »)
 *   - Selector rápido de mes y año (panel desplegable)
 *   - Límite de mayoría de edad (18+), inicio en lunes.
 * Funciona en web y móvil.
 *
 * @format
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, fontSizes, fontWeights, spacing } from '../theme';
import GradientOverlay from './GradientOverlay';

type CalendarModalProps = {
  visible: boolean;
  value: string; // DD/MM/AAAA
  onConfirm: (displayDate: string) => void;
  onClose: () => void;
};

const ADULT_AGE = 18;
const MIN_YEAR = 1900;

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

/** Índice de día de la semana con lunes = 0. */
const firstWeekdayMonday = (year: number, month: number): number =>
  (new Date(year, month, 1).getDay() + 6) % 7;

const compareDays = (a: Date, b: Date): number => {
  const left = startOfDay(a).getTime();
  const right = startOfDay(b).getTime();
  return left === right ? 0 : left > right ? 1 : -1;
};

const isSameDay = (a: Date | null, b: Date): boolean =>
  a !== null && compareDays(a, b) === 0;

const toDisplayDate = (date: Date): string =>
  `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;

const parseDisplayDate = (value: string): Date | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
};

const lastAdultDate = (): Date => {
  const today = new Date();
  return startOfDay(
    new Date(today.getFullYear() - ADULT_AGE, today.getMonth(), today.getDate()),
  );
};

const MIN_DATE = new Date(MIN_YEAR, 0, 1);

type Mode = 'days' | 'picker';

function CalendarModal({
  visible,
  value,
  onConfirm,
  onClose,
}: CalendarModalProps) {
  const maxDate = useMemo(() => lastAdultDate(), []);
  const maxYear = maxDate.getFullYear();
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(maxDate));
  const [selected, setSelected] = useState<Date | null>(null);
  const [mode, setMode] = useState<Mode>('days');

  useEffect(() => {
    if (!visible) {
      return;
    }
    const base = parseDisplayDate(value) ?? maxDate;
    const initial =
      compareDays(base, maxDate) > 0
        ? maxDate
        : compareDays(base, MIN_DATE) < 0
          ? MIN_DATE
          : startOfDay(base);
    setSelected(initial);
    setViewMonth(startOfMonth(initial));
    setMode('days');
  }, [visible, value, maxDate]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= MIN_YEAR; y -= 1) {
      list.push(y);
    }
    return list;
  }, [maxYear]);

  const canGoPrev = compareDays(startOfMonth(viewMonth), MIN_DATE) > 0;
  const canGoNext = compareDays(viewMonth, startOfMonth(maxDate)) < 0;
  const canGoPrevYear = year > MIN_YEAR;
  const canGoNextYear = year < maxYear;

  const changeMonth = (delta: number) => {
    setViewMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + delta, 1);
      if (compareDays(next, MIN_DATE) < 0 || compareDays(next, startOfMonth(maxDate)) > 0) {
        return current;
      }
      return next;
    });
  };

  const changeYear = (delta: number) => {
    const next = year + delta;
    if (next < MIN_YEAR || next > maxYear) {
      return;
    }
    setViewMonth(new Date(next, month, 1));
  };

  const selectMonth = (monthIndex: number) => {
    setViewMonth(new Date(year, monthIndex, 1));
    setMode('days');
  };

  const selectYear = (valueYear: number) => {
    setViewMonth(new Date(valueYear, month, 1));
  };

  const totalCells = daysInMonth(year, month) + firstWeekdayMonday(year, month);
  const cells: Array<{ day: number; date: Date } | null> = Array.from(
    { length: totalCells },
    (_, index) => {
      const day = index - firstWeekdayMonday(year, month) + 1;
      if (day < 1 || day > daysInMonth(year, month)) {
        return null;
      }
      return { day, date: startOfDay(new Date(year, month, day)) };
    },
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const canConfirm = selected !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.handle} />

          <Text style={styles.cardTitle}>
            {mode === 'days' ? 'Fecha de nacimiento' : 'Elegir mes y año'}
          </Text>
          <Text style={styles.cardSubtitle}>
            Debes tener {ADULT_AGE} años o más para registrarte.
          </Text>

          {mode === 'days' ? (
            <>
              <View style={styles.monthNav}>
                <Pressable
                  onPress={() => changeYear(-1)}
                  disabled={!canGoPrevYear}
                  hitSlop={12}
                  style={[styles.navButton, !canGoPrevYear && styles.navDisabled]}
                >
                  <Text style={styles.navArrowDouble}>«</Text>
                </Pressable>
                <Pressable
                  onPress={() => changeMonth(-1)}
                  disabled={!canGoPrev}
                  hitSlop={12}
                  style={[styles.navButton, !canGoPrev && styles.navDisabled]}
                >
                  <Text style={styles.navArrow}>‹</Text>
                </Pressable>

                <Pressable onPress={() => setMode('picker')} hitSlop={8}>
                  <Text style={styles.monthLabel}>
                    {MONTHS[month]} <Text style={styles.monthLabelYear}>{year}</Text>
                    <Text style={styles.monthLabelCaret}> ▾</Text>
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => changeMonth(1)}
                  disabled={!canGoNext}
                  hitSlop={12}
                  style={[styles.navButton, !canGoNext && styles.navDisabled]}
                >
                  <Text style={styles.navArrow}>›</Text>
                </Pressable>
                <Pressable
                  onPress={() => changeYear(1)}
                  disabled={!canGoNextYear}
                  hitSlop={12}
                  style={[styles.navButton, !canGoNextYear && styles.navDisabled]}
                >
                  <Text style={styles.navArrowDouble}>»</Text>
                </Pressable>
              </View>

              <View style={styles.weekRow}>
                {WEEKDAYS.map((weekday) => (
                  <Text key={weekday} style={styles.weekday}>
                    {weekday}
                  </Text>
                ))}
              </View>

              <View style={styles.grid}>
                {cells.map((cell, index) => {
                  if (!cell) {
                    return <View key={`empty-${index}`} style={styles.dayCell} />;
                  }

                  const isSelected = isSameDay(selected, cell.date);
                  const isToday = isSameDay(today, cell.date);
                  const isDisabled =
                    compareDays(cell.date, MIN_DATE) < 0 ||
                    compareDays(cell.date, maxDate) > 0;

                  return (
                    <View key={cell.day} style={styles.dayCell}>
                      <Pressable
                        disabled={isDisabled}
                        onPress={() => setSelected(cell.date)}
                        style={({ pressed }) => [
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected,
                          isToday && styles.dayButtonToday,
                          isDisabled && styles.dayButtonDisabled,
                          pressed && !isDisabled && styles.dayButtonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.picker}>
              <Text style={styles.pickerSectionLabel}>Mes</Text>
              <View style={styles.pickerMonths}>
                {MONTHS.map((monthName, index) => {
                  const isActive = index === month;
                  return (
                    <Pressable
                      key={monthName}
                      onPress={() => selectMonth(index)}
                      style={[
                        styles.pickerMonth,
                        isActive && styles.pickerMonthActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerMonthText,
                          isActive && styles.pickerMonthTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {monthName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.pickerSectionLabel}>Año</Text>
              <ScrollView
                style={styles.pickerYears}
                contentContainerStyle={styles.pickerYearsContent}
                showsVerticalScrollIndicator={false}
              >
                {years.map((yearValue) => {
                  const isActive = yearValue === year;
                  return (
                    <Pressable
                      key={yearValue}
                      onPress={() => selectYear(yearValue)}
                      style={[
                        styles.pickerYear,
                        isActive && styles.pickerYearActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerYearText,
                          isActive && styles.pickerYearTextActive,
                        ]}
                      >
                        {yearValue}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {mode === 'days' ? (
            <View style={styles.footer}>
              <Pressable onPress={onClose} style={styles.cancelButton} hitSlop={8}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                disabled={!canConfirm}
                onPress={() => {
                  if (selected) {
                    onConfirm(toDisplayDate(selected));
                  }
                }}
                style={[styles.confirmPressable, !canConfirm && styles.confirmDisabled]}
              >
                <GradientOverlay
                  colors={[Colors.primary, '#0E7BB8', Colors.accent]}
                  style={styles.confirmGradient}
                />
                <Text style={styles.confirmText}>Elegir fecha</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setMode('days')}
              style={styles.backButton}
              hitSlop={8}
            >
              <Text style={styles.backButtonText}>Volver al calendario</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(3, 18, 32, 0.55)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: Colors.primary,
  },
  cardSubtitle: {
    fontSize: fontSizes.caption,
    color: Colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceSubtle,
  },
  navDisabled: {
    opacity: 0.25,
  },
  navArrow: {
    fontSize: 26,
    color: Colors.primary,
    lineHeight: 28,
    marginTop: -2,
  },
  navArrowDouble: {
    fontSize: 20,
    color: Colors.primary,
    lineHeight: 22,
    marginTop: -1,
  },
  monthLabel: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
    color: Colors.textPrimary,
  },
  monthLabelYear: {
    color: Colors.primary,
  },
  monthLabelCaret: {
    color: Colors.accent,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    color: Colors.textSecondary,
    paddingVertical: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.accent,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  dayButtonDisabled: {
    opacity: 0.25,
  },
  dayButtonPressed: {
    backgroundColor: 'rgba(22,163,224,0.15)',
  },
  dayText: {
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  dayTextSelected: {
    color: Colors.textOnPrimary,
    fontWeight: fontWeights.bold,
  },
  picker: {
    marginTop: spacing.sm,
  },
  pickerSectionLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  pickerMonths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerMonth: {
    width: '31%',
    marginHorizontal: '1.16%',
    marginBottom: spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  pickerMonthActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  pickerMonthText: {
    fontSize: fontSizes.caption,
    color: Colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  pickerMonthTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: fontWeights.bold,
  },
  pickerYears: {
    maxHeight: 190,
  },
  pickerYearsContent: {
    paddingVertical: spacing.sm,
    gap: 8,
  },
  pickerYear: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 9,
    alignItems: 'center',
  },
  pickerYearActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  pickerYearText: {
    fontSize: fontSizes.body,
    color: Colors.textPrimary,
    fontWeight: fontWeights.medium,
  },
  pickerYearTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: fontWeights.bold,
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  backButtonText: {
    color: Colors.accent,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.base,
    marginTop: spacing.base,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semiBold,
  },
  confirmPressable: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B7FB8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmGradient: {
    borderRadius: 24,
  },
  confirmText: {
    color: Colors.textOnPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});

export default CalendarModal;