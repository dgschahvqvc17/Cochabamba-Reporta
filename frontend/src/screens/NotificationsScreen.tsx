/**
 * Pantalla: Notificaciones del ciudadano (MVC - View).
 *
 * Lista las alertas del ciudadano autenticado (GET
 * /api/v1/notifications), ordenadas de la más reciente a la más
 * antigua, con el código del incidente asociado, actualización por
 * pull-to-refresh y estado vacío.
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
import Icon from '../components/Icon';
import { fondo3 } from '../assets/images';
import { loadMyNotifications } from '../controllers/notificationController';
import type { Notification } from '../models/Notification';
import {
  Colors,
  fontSizes,
  fontWeights,
  spacing,
} from '../theme';
import { formatDateTime } from '../utils/format';

type NotificationsScreenProps = {
  onBack: () => void;
};

function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshingKey, setRefreshingKey] = useState(0);

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

            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.card,
                  !notification.read && styles.cardUnread,
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
                </View>

                <Text
                  style={[
                    styles.cardMessage,
                    notification.read && styles.cardMessageRead,
                  ]}
                >
                  {notification.message}
                </Text>

                <View style={styles.cardFoot}>
                  <Text style={styles.cardDate}>
                    {formatDateTime(notification.createdAt)}
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
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    backgroundColor: 'rgba(255,69,96,0.08)',
    borderColor: 'rgba(255,69,96,0.25)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: fontWeights.bold,
  },
  emptyText: {
    color: Colors.textMuted,
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
    backgroundColor: 'rgba(10, 30, 48, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.12)',
    borderRadius: 16,
    padding: spacing.base,
    marginTop: spacing.base,
    overflow: 'hidden',
  },
  cardUnread: {
    borderColor: 'rgba(255,184,0,0.5)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardIconUnread: {
    backgroundColor: 'rgba(255,184,0,0.12)',
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
    color: Colors.textOnDark,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  cardMessageRead: {
    color: Colors.textMuted,
    fontWeight: fontWeights.regular,
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
});

export default NotificationsScreen;