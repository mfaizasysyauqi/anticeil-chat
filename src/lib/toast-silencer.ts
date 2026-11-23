import React from 'react';

type ToastFunction = (message?: any, data?: any) => string | number;

const noopToast = ((..._args: any[]) => '') as unknown as ToastFunction & {
  success: ToastFunction;
  info: ToastFunction;
  warning: ToastFunction;
  error: ToastFunction;
  custom: ToastFunction;
  message: ToastFunction;
  promise: <T>(promise: Promise<T> | (() => Promise<T>), data?: any) => Promise<T>;
  dismiss: (id?: number | string) => string | number;
  loading: ToastFunction;
};

noopToast.success = () => '';
noopToast.info = () => '';
noopToast.warning = () => '';
noopToast.error = () => '';
noopToast.custom = () => '';
noopToast.message = () => '';
noopToast.promise = (p: any) => (typeof p === 'function' ? p() : p);
noopToast.dismiss = () => '';
noopToast.loading = () => '';

export const toast = noopToast;
export const Toaster: React.FC<any> = () => null;

export default toast;
