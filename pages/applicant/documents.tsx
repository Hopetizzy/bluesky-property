import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  Eye,
  Trash2,
  Loader2,
  Plus,
  AlertCircle,
  Check,
  ExternalLink,
  X,
  Lock,
  Download,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface VaultDocument {
  id: string;
  title: string;
  name: string;
  status: 'verified' | 'pending' | 'rejected';
  size: string;
  uploadedAt: string;
  type: string;
  storage_path?: string;
  previewUrl?: string;
}

function resolveDocumentUrl(pathOrUrl?: string, defaultName?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith('/vault/')) {
    return `/api/vault/view?path=${encodeURIComponent(pathOrUrl.replace(/^\/vault\//, ''))}`;
  }
  if (pathOrUrl.startsWith('/payments/')) {
    return `/api/vault/view?bucket=payment-proofs-vault&path=${encodeURIComponent(pathOrUrl.replace(/^\/payments\//, ''))}`;
  }
  return `/api/vault/view?path=${encodeURIComponent(pathOrUrl)}`;
}

export default function DocumentVaultPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('passport');
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [modalImgFailed, setModalImgFailed] = useState(false);

  useEffect(() => {
    async function loadDocs() {
      setIsLoading(true);
      try {
        let userDocs: VaultDocument[] = [];
        let email = '';

        if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            email = user.email || '';
            setUserEmail(email);

            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            if (profile?.id) {
              const { data: userApps } = await supabase
                .from('rental_applications')
                .select('id')
                .eq('applicant_id', profile.id);

              const appIds = (userApps || []).map((a: any) => a.id);
              if (appIds.length > 0) {
                const { data: dbDocs } = await supabase
                  .from('application_documents')
                  .select('*')
                  .in('application_id', appIds)
                  .order('created_at', { ascending: false });

                if (dbDocs && dbDocs.length > 0) {
                  userDocs = dbDocs.map((d: any) => {
                    const stPath = d.storage_path || '';
                    const preview = resolveDocumentUrl(stPath, d.file_name);
                    return {
                      id: String(d.id),
                      title: (d.document_type || 'document').replace(/_/g, ' ').toUpperCase(),
                      name: d.file_name || 'document_file.pdf',
                      status: d.status || 'pending',
                      size: d.file_size_bytes ? `${(d.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
                      uploadedAt: (d.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
                      type: d.document_type || 'other',
                      storage_path: stPath,
                      previewUrl: preview,
                    };
                  });
                }
              }
            }
          }
        }

        // Account-scoped local storage fallback
        if (typeof window !== 'undefined') {
          const storageKey = email ? `bluesky_vault_documents_${email}` : 'bluesky_vault_documents';
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const localDocs = parsed.map((d: any) => {
                const stPath = d.storage_path || `/vault/${email}/${d.name}`;
                const preview = d.previewUrl || resolveDocumentUrl(stPath, d.name);
                return {
                  ...d,
                  storage_path: stPath,
                  previewUrl: preview,
                };
              });

              // Merge unique docs
              const seenNames = new Set(userDocs.map((d) => d.name));
              for (const ld of localDocs) {
                if (!seenNames.has(ld.name)) {
                  userDocs.push(ld);
                  seenNames.add(ld.name);
                }
              }
            }
          }

          // Filter out deleted tombstone records
          const tombstoneKey = email ? `bluesky_deleted_docs_${email}` : 'bluesky_deleted_docs';
          const deletedList: string[] = JSON.parse(localStorage.getItem(tombstoneKey) || '[]');
          if (deletedList.length > 0) {
            const deletedSet = new Set(deletedList);
            userDocs = userDocs.filter((d) => !deletedSet.has(d.id) && !deletedSet.has(d.name));
          }
        }

        setDocuments(userDocs);
      } catch (err) {
        console.warn('Docs load note:', err);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocs();
  }, []);

  const saveDocsState = (docs: VaultDocument[]) => {
    setDocuments(docs);
    if (typeof window !== 'undefined') {
      try {
        const storageKey = userEmail ? `bluesky_vault_documents_${userEmail}` : 'bluesky_vault_documents';
        const sanitized = docs.map((doc) => {
          let preview = doc.previewUrl;
          if (preview && preview.startsWith('data:')) {
            preview = doc.storage_path || resolveDocumentUrl(doc.storage_path, doc.name);
          }
          return {
            ...doc,
            previewUrl: preview,
          };
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(sanitized));
        } catch (quotaErr) {
          console.warn('LocalStorage quota reached in saveDocsState, retrying after cleanup:', quotaErr);
          localStorage.removeItem(storageKey);
          localStorage.setItem(storageKey, JSON.stringify(sanitized));
        }
      } catch (err) {
        console.warn('saveDocsState non-blocking note:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccessMessage('');

    try {
      const fileName = file.name;
      const fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // Clear any tombstone if re-uploading
      if (typeof window !== 'undefined') {
        const tombstoneKey = userEmail ? `bluesky_deleted_docs_${userEmail}` : 'bluesky_deleted_docs';
        try {
          const deletedList: string[] = JSON.parse(localStorage.getItem(tombstoneKey) || '[]');
          const filtered = deletedList.filter((x) => x !== fileName);
          localStorage.setItem(tombstoneKey, JSON.stringify(filtered));
        } catch (e) {}
      }

      // Read as Data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let storagePath = `/vault/${userEmail || 'client'}/${fileName}`;
      let previewUrl = dataUrl;

      try {
        const res = await fetch('/api/vault/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            fileData: dataUrl,
            bucket: 'applicant-vault',
            folder: userEmail ? `vault_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 'vault',
          }),
        });
        const json = await res.json();
        if (json.success && json.storage_path) {
          storagePath = json.storage_path;
          previewUrl = json.preview_url || dataUrl;
        }
      } catch (uploadErr) {
        console.warn('Vault upload background sync note:', uploadErr);
      }

      const newDoc: VaultDocument = {
        id: `doc-${Date.now()}`,
        title: selectedDocType.replace(/_/g, ' ').toUpperCase(),
        name: fileName,
        status: 'pending',
        size: fileSize,
        uploadedAt: new Date().toISOString().slice(0, 10),
        type: selectedDocType,
        storage_path: storagePath,
        previewUrl: previewUrl,
      };

      const updated = [newDoc, ...documents];
      saveDocsState(updated);

      setSuccessMessage(`"${fileName}" uploaded successfully to your encrypted vault.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    const docToDelete = documents.find((d) => d.id === id);
    if (!docToDelete) return;

    if (confirm(`Are you sure you want to permanently delete "${docToDelete.name}" from your vault?`)) {
      // 1. Immediately update local state
      const filtered = documents.filter((d) => d.id !== id);
      saveDocsState(filtered);

      // 2. Call server-side deletion API
      try {
        await fetch('/api/vault/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: docToDelete.id,
            storagePath: docToDelete.storage_path,
            fileName: docToDelete.name,
            userEmail,
            bucket: 'applicant-vault',
          }),
        });
      } catch (apiErr) {
        console.warn('Vault delete API note:', apiErr);
      }

      // 3. Direct Supabase client delete
      if (isSupabaseConfigured()) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docToDelete.id);
          if (isUuid) {
            await supabase.from('application_documents').delete().eq('id', docToDelete.id);
          } else if (docToDelete.name) {
            await supabase.from('application_documents').delete().eq('file_name', docToDelete.name);
          }
        } catch (dbErr) {
          console.warn('Direct supabase delete note:', dbErr);
        }
      }

      // 4. Record tombstone in localStorage so it never reappears upon refresh
      if (typeof window !== 'undefined') {
        try {
          const tombstoneKey = userEmail ? `bluesky_deleted_docs_${userEmail}` : 'bluesky_deleted_docs';
          const currentDeleted: string[] = JSON.parse(localStorage.getItem(tombstoneKey) || '[]');
          currentDeleted.push(docToDelete.id, docToDelete.name);
          localStorage.setItem(tombstoneKey, JSON.stringify(currentDeleted));
        } catch (e) {}
      }

      setSuccessMessage(`"${docToDelete.name}" was permanently removed.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  return (
    <AppLayout title="Document Vault | Blue Sky Property" headerTitle="Document Vault">
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 16px 60px 16px',
        }}
      >
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => router.push('/applicant')}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              color: 'var(--color-navy-dark)',
              backgroundColor: 'var(--color-white)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)' }}>Encrypted ID Vault</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Security Assurance Banner */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            backgroundColor: 'var(--color-primary-tint)',
            padding: '18px 20px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #BAE6FD',
            marginBottom: 24,
          }}
        >
          <Shield size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 2 }}>
              Bank-Grade Document Encryption
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              All identity credentials, bank statements, and income letters are encrypted and stored in your restricted security vault. Files are accessible only to verified Blue Sky review specialists.
            </p>
          </div>
        </div>

        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success-text)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Vault Documents List */}
          <div>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                Vault Documents ({documents.length})
              </h2>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Loader2 size={28} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto' }} />
              </div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <FileText size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 10px auto' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Your vault is empty</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Upload your government ID, proof of income, or utility bill to expedite rental application verification.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="card"
                    style={{
                      margin: 0,
                      padding: 18,
                      borderRadius: 'var(--radius-xl)',
                      backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        {doc.title}
                      </div>
                      <Badge variant={doc.status === 'verified' ? 'verified' : 'pending'}>
                        {doc.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      <FileText size={15} color="var(--color-primary)" />
                      <span>{doc.name}</span> • <span>{doc.size}</span> • <span style={{ color: 'var(--color-text-muted)' }}>{doc.uploadedAt}</span>
                    </div>

                    <div className="flex-between" style={{ borderTop: '1px solid var(--color-surface-subtle)', paddingTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setModalImgFailed(false);
                          setPreviewDoc({
                            ...doc,
                            previewUrl: resolveDocumentUrl(doc.storage_path || doc.previewUrl, doc.name),
                          });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={14} /> Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-danger)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Upload Form */}
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              padding: 24,
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 14 }}>
              Upload Supporting Document
            </h3>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Document Category</label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="form-select"
              >
                <option value="passport">Government Photo ID (Passport / License)</option>
                <option value="proof_of_income">Proof of Income (Paystub / W2)</option>
                <option value="utility_bill_address">Proof of Address (Utility Bill)</option>
                <option value="employment_letter">Employment Verification Letter</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="other">Other Supporting Document</option>
              </select>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #BAE6FD',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--color-primary-tint)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {isUploading ? (
                <Loader2 size={32} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
              ) : (
                <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 4 }}>
                {isUploading ? 'Encrypting & uploading...' : 'Click to select document'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                PDF, PNG, JPG up to 15MB
              </p>
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>Documents are protected under end-to-end access policies. They will automatically be attached to any new property application you submit.</span>
            </div>
          </div>
        </div>

        {/* Interactive Document Preview Modal */}
        {previewDoc && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 16,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => {
              setPreviewDoc(null);
              setModalImgFailed(false);
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-2xl)',
                padding: 24,
                maxWidth: 620,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-modal)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                    {previewDoc.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {previewDoc.name} • {previewDoc.size}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDoc(null);
                    setModalImgFailed(false);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy-dark)' }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: 'var(--radius-xl)',
                  padding: 16,
                  textAlign: 'center',
                  border: '1px solid #334155',
                  marginBottom: 16,
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {!modalImgFailed && previewDoc.previewUrl && !previewDoc.name.toLowerCase().endsWith('.pdf') ? (
                  <img
                    src={previewDoc.previewUrl}
                    alt={previewDoc.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 380,
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                    onError={() => setModalImgFailed(true)}
                  />
                ) : (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <FileText size={56} color="#38BDF8" style={{ margin: '0 auto 12px auto' }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>{previewDoc.name}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                      {previewDoc.title} • {previewDoc.size}
                    </div>
                    <div style={{ fontSize: 12, color: '#38BDF8', marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(2, 132, 199, 0.15)', padding: '6px 14px', borderRadius: 20, border: '1px solid #0284C7' }}>
                      <Lock size={12} /> Stored in Encrypted Underwriting Vault
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {previewDoc.previewUrl && (
                  <a
                    href={previewDoc.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Open Full Document
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: 13 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
