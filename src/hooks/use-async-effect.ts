
import { useEffect } from 'react';

type AsyncEffectCallback = () => Promise<void | (() => void)>;

export function useAsyncEffect(callback: AsyncEffectCallback, dependencies: any[]) {
  useEffect(() => {
    const promise = callback();
    let cleanup: (() => void) | void;
    
    (async () => {
      cleanup = await promise;
    })();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
