import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useStore } from '../store.jsx'
import { reconcile, subscribeStatus, getStatus } from './index.js'

export function useRagStatus() {
  return useSyncExternalStore(subscribeStatus, getStatus)
}

/**
 * Mount once, somewhere that's always rendered (ChatShell). Re-syncs the
 * index after chats go quiet: 8 s after the last change (so it never runs
 * mid-stream), or almost immediately when the RAG config itself changes.
 */
export function useRagIndexer() {
  const { chats, settings, nodeUrl, apiUrl } = useStore()
  const cfgKey = JSON.stringify([settings.ragEnabled, settings.ragEmbedding, nodeUrl, apiUrl])
  const prevCfg = useRef(null)

  useEffect(() => {
    const delay = prevCfg.current === cfgKey ? 8000 : 300
    prevCfg.current = cfgKey
    const t = setTimeout(() => reconcile({ chats, settings, nodeUrl, apiUrl }), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, cfgKey])
}
