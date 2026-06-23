import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseScannerLockOptions {
  lockDurationMs?: number;
}

export interface ScannerLock {
  locked: boolean;
  setLocked: Dispatch<SetStateAction<boolean>>;
  lock: (durationMs?: number) => void;
  unlock: () => void;
  tryLock: (durationMs?: number) => boolean;
}

const DEFAULT_LOCK_DURATION_MS = 900;

export function useScannerLock(options: UseScannerLockOptions = {}): ScannerLock {
  const { lockDurationMs = DEFAULT_LOCK_DURATION_MS } = options;
  const [locked, setLockedState] = useState(false);
  const lockedRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUnlockTimer = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, []);

  const setLocked = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      const nextLocked =
        typeof value === 'function'
          ? (value as (previousLocked: boolean) => boolean)(lockedRef.current)
          : value;

      if (!nextLocked) {
        clearUnlockTimer();
      }

      lockedRef.current = nextLocked;
      setLockedState(nextLocked);
    },
    [clearUnlockTimer]
  );

  const unlock = useCallback(() => {
    setLocked(false);
  }, [setLocked]);

  const lock = useCallback(
    (durationMs = lockDurationMs) => {
      clearUnlockTimer();
      lockedRef.current = true;
      setLockedState(true);

      unlockTimerRef.current = setTimeout(() => {
        lockedRef.current = false;
        setLockedState(false);
        unlockTimerRef.current = null;
      }, durationMs);
    },
    [clearUnlockTimer, lockDurationMs]
  );

  const tryLock = useCallback(
    (durationMs = lockDurationMs) => {
      if (lockedRef.current) {
        return false;
      }

      lock(durationMs);
      return true;
    },
    [lock, lockDurationMs]
  );

  useEffect(() => {
    return clearUnlockTimer;
  }, [clearUnlockTimer]);

  return {
    locked,
    setLocked,
    lock,
    unlock,
    tryLock,
  };
}
