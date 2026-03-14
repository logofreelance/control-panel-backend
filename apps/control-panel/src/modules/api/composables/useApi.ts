import { useState, useEffect, useCallback, useRef } from 'react';
import { MODULE_LABELS, API_ROUTES, API_STATUS } from '@cp/config';
import { useToast } from '@/modules/_core';
import { env } from '@/lib/env';
import type { ApiKey, CorsDomain, ConfirmDialogState } from '../types';
import { fetchWithCsrf } from '@/lib/csrf';

interface NodeHealth {
    nodeId: string;
    endpointUrl: string;
    status: string;
    cpuUsage: string;
    memoryUsage: string;
    uptime: number;
    lastHeartbeat: string;
}

const L = MODULE_LABELS.api;

export function useApi() {
    const { addToast } = useToast();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [domains, setDomains] = useState<CorsDomain[]>([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

    // Active Nodes state
    const [activeNodes, setActiveNodes] = useState<NodeHealth[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
    const [nodesLoading, setNodesLoading] = useState(true);

    // Refs for stable references
    const toastRef = useRef(addToast);
    const hasDataRef = useRef(false);

    useEffect(() => { toastRef.current = addToast; }, [addToast]);

    const fetchData = useCallback(async () => {
        if (!hasDataRef.current) {
            setLoading(true);
        }

        try {
            const [kRes, dRes] = await Promise.all([
                fetch(`${env.API_BASE}${API_ROUTES.apiKeys.list.replace('/api', '')}`),
                fetch(`${env.API_BASE}${API_ROUTES.cors.list.replace('/api', '')}`)
            ]);
            const [kData, dData] = await Promise.all([kRes.json(), dRes.json()]);
            if (kData.status === API_STATUS.SUCCESS) setKeys(kData.data || []);
            if (dData.status === API_STATUS.SUCCESS) setDomains(dData.data || []);
            hasDataRef.current = true;
        } catch {
            toastRef.current(L.messages.loadFailed, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch active nodes from nodes-health endpoint
    const fetchActiveNodes = useCallback(async () => {
        try {
            const res = await fetch(`${env.API_BASE}/nodes-health`);
            const json = await res.json();
            if (json.status === 'success' && Array.isArray(json.data)) {
                const nodes: NodeHealth[] = json.data;
                setActiveNodes(nodes);
                const onlineNode = nodes.find((n) => n.status === 'online');
                if (onlineNode) setSelectedEndpoint(onlineNode.endpointUrl);
            }
        } catch (err) {
            console.error('[API] Failed to fetch nodes:', err);
        } finally {
            setNodesLoading(false);
        }
    }, []);

    useEffect(() => { fetchActiveNodes(); }, [fetchActiveNodes]);

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetchWithCsrf(`${env.API_BASE}${API_ROUTES.apiKeys.create.replace('/api', '')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (data.status === API_STATUS.SUCCESS) {
                addToast(L.messages.apiKeyCreated, 'success');
                setNewKeyName('');
                fetchData();
            }
        } catch { addToast(L.messages.createKeyError, 'error'); }
        setSubmitting(false);
    };

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetchWithCsrf(`${env.API_BASE}${API_ROUTES.cors.create.replace('/api', '')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain })
            });
            const data = await res.json();
            if (data.status === API_STATUS.SUCCESS) {
                addToast(L.messages.domainAdded, 'success');
                setNewDomain('');
                fetchData();
            }
        } catch { addToast(L.messages.addDomainError, 'error'); }
        setSubmitting(false);
    };

    const handleDelete = async () => {
        if (!confirmDialog) return;
        setSubmitting(true);
        try {
            await fetchWithCsrf(`${env.API_BASE}/${confirmDialog.type}/${confirmDialog.id}`, { method: 'DELETE' });
            addToast(L.messages.deletedSuccess, 'success');
            fetchData();
        } catch { addToast(L.messages.deleteFailed, 'error'); }
        setSubmitting(false);
        setConfirmDialog(null);
    };

    const copyToClipboard = (text: string, message: string = L.messages.copiedToClipboard) => {
        navigator.clipboard.writeText(text);
        addToast(message, 'success');
    };

    const openDeleteDialog = (type: 'api-keys' | 'cors', id: number, name: string) => {
        setConfirmDialog({ type, id, name });
    };

    const closeDeleteDialog = () => {
        setConfirmDialog(null);
    };

    const getConfirmDialogTitle = () => {
        if (!confirmDialog) return '';
        return confirmDialog.type === 'api-keys' ? L.confirm.deleteApiKey : L.confirm.removeCors;
    };

    const getConfirmDialogMessage = () => {
        if (!confirmDialog) return '';
        return `${L.confirm.deleteMessage} "${confirmDialog.name}"? ${L.confirm.cannotUndo}`;
    };

    return {
        // State
        keys,
        domains,
        newKeyName,
        newDomain,
        loading,
        submitting,
        confirmDialog,
        // Setters
        setNewKeyName,
        setNewDomain,
        // Actions
        fetchData,
        handleCreateKey,
        handleAddDomain,
        handleDelete,
        copyToClipboard,
        openDeleteDialog,
        closeDeleteDialog,
        getConfirmDialogTitle,
        getConfirmDialogMessage,
        // Nodes
        activeNodes,
        selectedEndpoint,
        nodesLoading,
        setSelectedEndpoint,
    };
}
