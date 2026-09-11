/**
 * Hook compartido: Diálogos de confirmación e información (MVC - hooks).
 *
 * Reemplaza a React Native `Alert` (que en web es un no-op y "traga" la
 * confirmación) por un diálogo propio renderizado por `AppDialog`.
 * Todos los flujos de confirmación y mensajes pasan por aquí para
 * comportarse igual en web y en móvil.
 *
 * @format
 */

import { useCallback, useState } from 'react';

export type DialogTone = 'accent' | 'danger' | 'success' | 'warning' | 'info';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: DialogTone;
  onConfirm: () => void;
};

export type InfoOptions = {
  title: string;
  message?: string;
  onAccept?: () => void;
};

export type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  tone: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isInfo: boolean;
};

const HIDDEN: DialogState = {
  visible: false,
  title: '',
  tone: 'info',
  isInfo: false,
};

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>(HIDDEN);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setDialog({
      visible: true,
      title: opts.title,
      message: opts.message,
      tone: opts.tone ?? 'accent',
      confirmLabel: opts.confirmLabel ?? 'Confirmar',
      cancelLabel: opts.cancelLabel ?? 'Cancelar',
      onConfirm: opts.onConfirm,
      isInfo: false,
    });
  }, []);

  const info = useCallback((opts: InfoOptions) => {
    setDialog({
      visible: true,
      title: opts.title,
      message: opts.message,
      tone: 'info',
      confirmLabel: 'Aceptar',
      onConfirm: opts.onAccept,
      isInfo: true,
    });
  }, []);

  const close = useCallback(() => {
    setDialog((current) =>
      current.visible ? { ...current, visible: false } : current,
    );
  }, []);

  return { dialog, confirm, info, close };
}