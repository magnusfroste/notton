import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  deriveKey,
  generateSalt,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  encryptNote,
  decryptNote,
  validateEncryptionPassword,
  type EncryptedData,
} from '@/lib/encryption';
import { supabase } from '@/integrations/supabase/client';

interface EncryptionContextType {
  isEncryptionEnabled: boolean;
  isKeyLoaded: boolean;
  encryptionSalt: string | null;
  setupEncryption: (password: string) => Promise<{ error: Error | null }>;
  loadEncryptionKey: (password: string) => Promise<{ error: Error | null }>;
  clearEncryptionKey: () => void;
  encrypt: (text: string) => Promise<EncryptedData>;
  decrypt: (data: EncryptedData) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(
  undefined
);

export function EncryptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [encryptionSalt, setEncryptionSalt] = useState<string | null>(null);

  // Initialize encryption settings on mount
  React.useEffect(() => {
    const checkEncryptionStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('encryption_enabled, encryption_salt')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsEncryptionEnabled(profile.encryption_enabled || false);
        setEncryptionSalt(profile.encryption_salt);
      }
    };

    checkEncryptionStatus();
  }, []);

  /**
   * Set up encryption for the first time
   */
  const setupEncryption = useCallback(
    async (password: string): Promise<{ error: Error | null }> => {
      try {
        // Validate password strength
        const validation = validateEncryptionPassword(password);
        if (!validation.valid) {
          return { error: new Error(validation.message) };
        }

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { error: new Error('Not authenticated') };
        }

        // Generate salt and derive key
        const salt = generateSalt();
        const saltBase64 = arrayBufferToBase64(salt);
        const key = await deriveKey(password, salt);

        // Save salt and enable encryption in profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            encryption_enabled: true,
            encryption_salt: saltBase64,
            encryption_version: 1,
          })
          .eq('id', user.id);

        if (updateError) {
          return { error: updateError };
        }

        // Store key in memory
        setEncryptionKey(key);
        setIsEncryptionEnabled(true);
        setEncryptionSalt(saltBase64);

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  /**
   * Load encryption key after login
   */
  const loadEncryptionKey = useCallback(
    async (password: string): Promise<{ error: Error | null }> => {
      try {
        if (!encryptionSalt) {
          return { error: new Error('Encryption not set up') };
        }

        // Derive key from password and stored salt
        const saltBuffer = base64ToArrayBuffer(encryptionSalt);
        const salt = new Uint8Array(saltBuffer);
        const key = await deriveKey(password, salt);

        // Store in memory
        setEncryptionKey(key);

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    [encryptionSalt]
  );

  /**
   * Clear encryption key from memory (logout/lock)
   */
  const clearEncryptionKey = useCallback(() => {
    setEncryptionKey(null);
  }, []);

  /**
   * Encrypt text
   */
  const encrypt = useCallback(
    async (text: string): Promise<EncryptedData> => {
      if (!encryptionKey) {
        throw new Error('Encryption key not loaded');
      }
      return encryptNote(text, encryptionKey);
    },
    [encryptionKey]
  );

  /**
   * Decrypt text
   */
  const decrypt = useCallback(
    async (data: EncryptedData): Promise<string> => {
      if (!encryptionKey) {
        throw new Error('Encryption key not loaded');
      }
      return decryptNote(data, encryptionKey);
    },
    [encryptionKey]
  );

  return (
    <EncryptionContext.Provider
      value={{
        isEncryptionEnabled,
        isKeyLoaded: encryptionKey !== null,
        encryptionSalt,
        setupEncryption,
        loadEncryptionKey,
        clearEncryptionKey,
        encrypt,
        decrypt,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
}
