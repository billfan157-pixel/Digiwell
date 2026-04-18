// ============================================================
// DigiWell — Biometric Authentication Hook
// NATIVE BIOMETRIC (Face ID / Touch ID) via Capacitor Plugin
// ============================================================

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
// @ts-ignore: Bỏ qua lỗi check type của TypeScript cho plugin này
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export function useBiometric() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isBiometricSupported = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  }, []);

  const registerBiometric = useCallback(async (userId: string): Promise<boolean> => {
    setIsRegistering(true);
    try {
      if (!Capacitor.isNativePlatform()) {
        toast.error('Tính năng này chỉ hoạt động trên thiết bị di động thật!');
        return false;
      }

      // Kiểm tra thiết bị có hỗ trợ không
      const available = await NativeBiometric.isAvailable();
      if (!available.isAvailable) throw new Error('Thiết bị không hỗ trợ Sinh trắc học');

      // Quét mặt 1 lần để xác nhận chủ máy trước khi bật khóa
      await NativeBiometric.verifyIdentity({
        reason: "Xác nhận danh tính để bật Khóa ứng dụng",
        title: "Thiết lập bảo mật",
      });

      localStorage.setItem('biometric_enabled', 'true');
      toast.success('✅ Bật khóa sinh trắc học thành công!');
      return true;
    } catch (error: any) {
      toast.error('Thiết lập thất bại hoặc đã bị hủy.');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const authenticateBiometric = useCallback(async (userId: string): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      if (!Capacitor.isNativePlatform()) return true; // Bypass trên web demo

      const isEnabled = localStorage.getItem('biometric_enabled') === 'true';
      if (!isEnabled) {
        toast.error('Bạn chưa bật tính năng khóa ứng dụng');
        return false;
      }

      await NativeBiometric.verifyIdentity({
        reason: "Quét khuôn mặt / Vân tay để mở khóa DigiWell",
        title: "Mở khóa DigiWell",
      });
      
      return true;
    } catch (error: any) {
      toast.error('Xác thực không thành công.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const disableBiometric = useCallback((userId: string) => {
    localStorage.removeItem('biometric_enabled');
    toast.info('🔒 Đã tắt đăng nhập sinh trắc học');
  }, []);

  const getBiometricStatus = useCallback((userId: string) => {
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    return { registered: enabled, enabled };
  }, []);

  return {
    isBiometricSupported,
    isRegistering,
    isAuthenticating,
    registerBiometric,
    authenticateBiometric,
    disableBiometric,
    getBiometricStatus,
  };
}