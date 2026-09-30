/**
 * Pantalla: Notificaciones del ciudadano (MVC - View).
 *
 * HU14 — Lista las alertas del ciudadano autenticado (GET
 * /api/v1/notifications), ordenadas de la más reciente a la más
 * antigua, con el código del incidente asociado. Cada tarjeta se puede
 * expandir para consultar el detalle, marcarla como leída o ir al
 * seguimiento del incidente. Incluye pull-to-refresh y estado vacío.
 *
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminImageHeader from '../components/AdminImageHeader';
import AppDialog from '../components/AppDialog';
import Icon from '../components/Icon';
import PrimaryButton from '../components/PrimaryButton';
import { fondo3 } from '../assets/images';
import {
  loadMyNotifications,
  markNotificationAsRead,
} from '../controllers/notificationController';
import { useDialog } from '../hooks/useDialog';
import type { Notification } from '../models/Notification';
import {
  Colors,
  fontSizes,
  fontWeights,
  radius,
  spacing,
} from '../theme';
import { formatDateTime } from '../utils/format';

type NotificationsScreenProps = {
  onBack: () => void;
  onOpenFollowUp?: (incidentId: number) => void;
};

function NotificationsScreen({ onBack, onOpenFollowUp }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const { dialog, error: showError, close } = useDialog();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshingKey, setRefreshingKey] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);

  const load = useCallback(async (refreshing = false) => {
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    setErrorMessage(null);

    const result = await loadMyNotifications();

    refreshing ? setIsRefreshing(false) : setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setNotifications(result.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshingKey]);

  const handleMarkRead = async (notification: Notification) => {
    if (markingReadId) return;

    setMarkingReadId(notification.id);

    const result = await markNotificationAsRead(notification.id);

    setMarkingReadId(null);

    if (!result.success || !result.data) {
      showError({
        title: 'No se pudo marcar como leída',
        message: result.message,
      });
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === result.data!.id ? { ...item, read: true } : item,
      ),
    );
  };

  const handleOpenFollowUp = (notification: Notification) => {
    if (notification.incidentId && onOpenFollowUp) {
      onOpenFollowUp(notification.incidentId);
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <View style={styles.flex}>
      <AdminImageHeader
        background={fondo3}
        title="Notificaciones"
        subtitle={
          isLoading
            ? 'Consultando tus alertas…'
            : `${notifications.length} notificacion${
                notifications.length !== 1 ? 'es' : ''
              }`
        }
        badge="ALERTAS"
        contentBackground={Colors.background}
        onBack={onBack}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
            colors={[Colors.accent]}
            tintColor={Colors.accent}
          />
        }
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.centerText}>Cargando notificaciones…</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Icon name="info" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => setRefreshingKey((key) => key + 1)}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Icon name="bell" size={36} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando haya novedades en tus reportes, aparecerán aquí las alertas.
            </Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 ? (
              <Text style={styles.unreadSummary}>
                {unreadCount} no leída{unreadCount !== 1 ? 's' : ''}
              </Text>
            ) : null}

            {notifications.map((notification) => {
              const isExpanded = expandedId === notification.id;
              const isMarking = markingReadId === notification.id;
              const canOpenFollowUp = Boolean(
                notification.incidentId && onOpenFollowUp,
              );

              return (
                <Pressable
                  key={notification.id}
                  disabled={isMarking}
                  onPress={() =>
                    setExpandedId((current) =>
                      current === notification.id ? null : notification.id,
                    )
                  }
                  style={({ pressed }) => [
                    styles.card,
                    !notification.read && styles.cardUnread,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.cardIcon,
                        !notification.read && styles.cardIconUnread,
                      ]}
                    >
                      <Icon
                        name={notification.read ? 'checkCircle' : 'bell'}
                        size={18}
                        color={notification.read ? Colors.textSecondary : Colors.accent}
                      />
                    </View>
                    {notification.incidentCode ? (
                      <Text style={styles.cardCode}>
                        {notification.incidentCode}
                      </Text>
                    ) : null}
                    {!notification.read ? (
                      <View style={styles.unreadDot} />
                    ) : null}
                    <Icon
                      name={isExpanded ? 'chevronDown' : 'chevronRight'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </View>

                  <Text
                    numberOfLines={isExpanded ? undefined : 2}
                    style={[
                      styles.cardMessage,
                      notification.read && styles.cardMessageRead,
                    ]}
                  >
                    {notification.message}
                  </Text>

                  {isExpanded ? (
                    <View style={styles.expandedBox}>
                      <View style={styles.cardFoot}>
                        <Text style={styles.cardDate}>
                          Recibida: {formatDateTime(notification.createdAt)}
                        </Text>
                        <Text
                          style={[
                            styles.cardState,
                            !notification.read && styles.cardStateUnread,
                          ]}
                        >
                          {notification.read ? 'Leída' : 'No leída'}
                        </Text>
                      </View>

                      <View style={styles.expandedActions}>
                        {!notification.read ? (
                          <Pressable
                            onPress={() => handleMarkRead(notification)}
                            disabled={isMarking}
                            style={({ pressed }) => [
                              styles.readBtn,
                              pressed && styles.actionPressed,
                            ]}
                          >
                            {isMarking ? (
                              <ActivityIndicator color={Colors.accent} size="small" />
                            ) : (
                              <>
                                <Icon name="check" size={16} color={Colors.accent} />
                                <Text style={styles.readBtnText}>
                                  Marcar como leída
                                </Text>
                              </>
                            )}
                          </Pressable>
                        ) : null}

                        {canOpenFollowUp ? (
                          <PrimaryButton
                            label="Ver seguimiento del incidente"
                            variant="ghost"
                            fullWidth={false}
                            onPress={() => handleOpenFollowUp(notification)}
                          />
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <AppDialog dialog={dialog} onCancel={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  centerText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(194,73,79,0.08)',
    borderColor: 'rgba(194,73,79,0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.base,
    marginTop: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: fontSizes.caption,
  },
  retryText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: fontWeights.bold,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
  unreadSummary: {
    color: Colors.warning,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.12)',
    borderRadius: 16,
    padding: spacing.base,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardUnread: {
    borderColor: 'rgba(217,164,65,0.5)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  cardIconUnread: {
    backgroundColor: 'rgba(217,164,65,0.12)',
  },
  cardCode: {
    flex: 1,
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warning,
  },
  cardMessage: {
    color: Colors.textPrimary,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  cardMessageRead: {
    color: Colors.textSecondary,
    fontWeight: fontWeights.regular,
  },
  expandedBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  cardDate: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
  },
  cardState: {
    color: Colors.textSecondary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
  cardStateUnread: {
    color: Colors.warning,
    fontWeight: fontWeights.bold,
  },
  expandedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(59,130,184,0.4)',
    backgroundColor: 'rgba(59,130,184,0.08)',
    alignSelf: 'flex-start',
    minHeight: 40,
  },
  readBtnText: {
    color: Colors.accent,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  actionPressed: {
    opacity: 0.7,
  },
});

export default NotificationsScreen;