import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Upload,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Lock,
  Loader2,
  Sparkles,
  Info,
  ChevronRight,
  ImageIcon,
  Copy,
  X,
  ShieldCheck,
  FileCheck2,
  Building2,
  MapPin,
  ExternalLink,
  EyeOff,
  Globe,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { store } from '@/lib/store';
import { PaymentMethod } from '@/lib/types';

interface UploadedFileRecord {
  name: string;
  size: string;
  bytes: number;
  type: string;
  previewUrl?: string;
  storagePath?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '1.2 MB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DirectApplyPage() {
  const router = useRouter();
  const { token } = router.query;

  const [portalData, setPortalData] = useState<any>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Personal Details & Optional Property Choice
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('United States');

  // Step 2: Identification Uploads
  const [idType, setIdType] = useState<'drivers_license' | 'national_id' | 'passport' | 'residence_permit'>('drivers_license');
  const [idFrontFile, setIdFrontFile] = useState<UploadedFileRecord | null>(null);
  const [idBackFile, setIdBackFile] = useState<UploadedFileRecord | null>(null);

  // Step 3: SSN & Income & Address Proofs
  const [ssnNumber, setSsnNumber] = useState('');
  const [showSsn, setShowSsn] = useState(false);
  const [employer, setEmployer] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [incomeDoc, setIncomeDoc] = useState<UploadedFileRecord | null>(null);
  const [addressDoc, setAddressDoc] = useState<UploadedFileRecord | null>(null);

  // Step 4: Lease Preferences
  const [moveInDate, setMoveInDate] = useState('');
  const [leaseMonths, setLeaseMonths] = useState('12');
  const [occupants, setOccupants] = useState('1');
  const [hasPets, setHasPets] = useState(false);
  const [petsDescription, setPetsDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Step 5: Verification Fee & Payment Method
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [proofPaymentFile, setProofPaymentFile] = useState<UploadedFileRecord | null>(null);

  // Step 6: Legal Certification
  const [agreedToTruth, setAgreedToTruth] = useState(false);
  const [agreedToScreening, setAgreedToScreening] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Input Refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const incomeInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Load Portal metadata from API
  useEffect(() => {
    async function fetchPortal() {
      if (!token) return;
      setIsLoadingPortal(true);
      setPortalError(null);

      try {
        const res = await fetch(`/api/apply/direct?token=${encodeURIComponent(token as string)}`);
        const json = await res.json();

        if (json.success && json.data) {
          setPortalData(json.data);
          if (Array.isArray(json.data.payment_methods) && json.data.payment_methods.length > 0) {
            setPaymentMethods(json.data.payment_methods);
            setSelectedMethodId(json.data.payment_methods[0].id);
          } else {
            const fallbackMethods = store.getPaymentMethods().filter((m) => m.is_active);
            setPaymentMethods(fallbackMethods);
            if (fallbackMethods.length > 0) setSelectedMethodId(fallbackMethods[0].id);
          }

          if (Array.isArray(json.data.assigned_properties) && json.data.assigned_properties.length > 0) {
            setSelectedPropertyId(json.data.assigned_properties[0].id);
            if (json.data.assigned_properties[0].units?.length > 0) {
              setSelectedUnitId(json.data.assigned_properties[0].units[0].id);
            }
          }
        } else {
          setPortalError(json.error || 'This application portal link is invalid or has expired.');
        }
      } catch (err: any) {
        console.error('Portal load error:', err);
        setPortalError('Failed to load application portal.');
      } finally {
        setIsLoadingPortal(false);
      }
    }

    fetchPortal();
  }, [token]);

  // File upload helper
  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadedFileRecord | null>>,
    bucket: string = 'applicant-vault'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const initialObjUrl = URL.createObjectURL(file);
      setter({
        name: file.name,
        size: formatBytes(file.size),
        bytes: file.size,
        type: file.type,
        previewUrl: initialObjUrl,
      });

      const reader = new FileReader();
      reader.onload = async (uploadEvt) => {
        const dataUrl = uploadEvt.target?.result as string;
        setter((prev) => (prev ? { ...prev, previewUrl: dataUrl } : null));

        try {
          const res = await fetch('/api/vault/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: dataUrl,
              bucket,
              folder: email ? `vault_${email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'vault_direct',
            }),
          });
          const json = await res.json();
          if (json.success && json.storage_path) {
            setter((prev) =>
              prev
                ? {
                    ...prev,
                    storagePath: json.storage_path,
                    previewUrl: json.preview_url || dataUrl,
                  }
                : null
            );
          }
        } catch (uploadErr) {
          console.warn('Background sync note:', uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step Validation
  const isStep1Valid = Boolean(fullName.trim() && phone.trim() && email.trim() && dob && nationality.trim());
  const isStep2Valid = Boolean(idFrontFile && idBackFile);
  const isStep3Valid = Boolean(
    ssnNumber.trim() &&
    employer.trim() &&
    occupation.trim() &&
    monthlyIncome.trim() &&
    currentAddress.trim()
  );
  const isStep4Valid = Boolean(moveInDate && leaseMonths && occupants);
  const isStep5Valid = portalData?.fee_enabled ? Boolean(selectedMethodId && proofPaymentFile) : true;
  const isStep6Valid = Boolean(agreedToTruth && agreedToScreening && agreedToPrivacy);

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    if (currentStep === 4) return isStep4Valid;
    if (currentStep === 5) return isStep5Valid;
    if (currentStep === 6) return isStep6Valid;
    return true;
  };

  // Submit Final Application
  const handleSubmitApplication = async () => {
    if (!canProceed() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

      const docsPayload: any[] = [];
      if (idFrontFile) {
        docsPayload.push({
          document_type: idType,
          file_name: idFrontFile.name,
          storage_path: idFrontFile.storagePath || idFrontFile.previewUrl,
          file_size_bytes: idFrontFile.bytes,
          mime_type: idFrontFile.type,
        });
      }
      if (idBackFile) {
        docsPayload.push({
          document_type: idType,
          file_name: idBackFile.name,
          storage_path: idBackFile.storagePath || idBackFile.previewUrl,
          file_size_bytes: idBackFile.bytes,
          mime_type: idBackFile.type,
        });
      }
      if (incomeDoc) {
        docsPayload.push({
          document_type: 'proof_of_income',
          file_name: incomeDoc.name,
          storage_path: incomeDoc.storagePath || incomeDoc.previewUrl,
          file_size_bytes: incomeDoc.bytes,
          mime_type: incomeDoc.type,
        });
      }
      if (addressDoc) {
        docsPayload.push({
          document_type: 'utility_bill_address',
          file_name: addressDoc.name,
          storage_path: addressDoc.storagePath || addressDoc.previewUrl,
          file_size_bytes: addressDoc.bytes,
          mime_type: addressDoc.type,
        });
      }

      const payload = {
        token,
        link_id: portalData?.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob,
        nationality,
        property_id: selectedPropertyId || null,
        unit_id: selectedUnitId || null,
        ssn_number: ssnNumber.trim(),
        employer: employer.trim(),
        occupation: occupation.trim(),
        monthly_income: monthlyIncome.trim(),
        current_address: currentAddress.trim(),
        documents: docsPayload,
        desired_move_in: moveInDate,
        lease_term_months: Number(leaseMonths) || 12,
        occupants_count: Number(occupants) || 1,
        has_pets: hasPets,
        pets_description: petsDescription,
        additional_notes: additionalNotes,
        payment_method_id: selectedMethod?.id || null,
        payment_method_name: selectedMethod?.name || null,
        payment_amount: portalData?.fee_amount || 50,
        proof_storage_path: proofPaymentFile?.storagePath || proofPaymentFile?.previewUrl || null,
        proof_file_name: proofPaymentFile?.name || null,
      };

      const res = await fetch('/api/apply/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        router.push(`/apply/success?ref=${encodeURIComponent(json.application_ref || 'DIR-APP')}&email=${encodeURIComponent(email)}`);
      } else {
        alert(`Submission Error: ${json.error || 'Please check your information and try again.'}`);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert('Network error submitting application. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoadingPortal) {
    return (
      <AppLayout title="Direct Rental Application | Blue Sky Property" isPublic={true} hideHeader={true}>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <div>
            <Loader2 size={40} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              Loading Verified Application Portal...
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, maxWidth: 420, margin: '6px auto 0' }}>
              Securing connection and loading intake parameters. No account or prior login required.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (portalError || !portalData) {
    return (
      <AppLayout title="Portal Unavailable | Blue Sky Property" isPublic={true} hideHeader={true}>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
              Application Portal Unavailable
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              {portalError || 'This direct application link is either invalid, inactive, or has expired.'}
            </p>
            <div style={{ marginTop: 24 }}>
              <Link href="/properties" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                Explore Available Properties
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedPropertyObj = portalData.assigned_properties?.find((p: any) => p.id === selectedPropertyId);

  return (
    <AppLayout title={`${portalData.title || 'Rental Application'} | Blue Sky Property`} isPublic={true} hideHeader={true}>
      {/* Brand & Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '40px 20px 48px 20px',
          borderBottom: '1px solid #334155',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img
                src="/Logo.png"
                alt="Blue Sky Property"
                style={{ height: 36, width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Blue Sky
              </span>
            </Link>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '5px 12px',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                color: '#38BDF8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <ShieldCheck size={14} /> Official Direct Intake Portal
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            {portalData.title || 'Direct Rental Application'}
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 20px 0', maxWidth: 640, lineHeight: 1.5 }}>
            Complete your rental application and verification profile in 6 simple steps. No prior account or login is required. Your documents and identity details are protected inside our ISO-certified encrypted underwriting vault.
          </p>

          {/* Portal Custom Admin Instructions */}
          {portalData.instructions && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                fontSize: 13,
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                lineHeight: 1.45,
              }}
            >
              <Info size={18} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#FFFFFF' }}>Special Intake Instructions: </strong>
                {portalData.instructions}
              </div>
            </div>
          )}

          {/* Quick Feature Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} color="#38BDF8" /> 256-Bit SSL Encrypted
            </span>
            <span style={{ fontSize: 12, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck2 size={13} color="#38BDF8" /> Direct Underwriter Review
            </span>
            <span style={{ fontSize: 12, color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} color="#38BDF8" /> Instant Receipt Generation
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 16px 80px 16px', maxWidth: 840, margin: '0 auto' }}>
        {/* 6-Step Visual Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, position: 'relative' }}>
          {[1, 2, 3, 4, 5, 6].map((s) => {
            const isDone = currentStep > s;
            const isCurrent = currentStep === s;
            const labels = ['Personal & Intro', 'ID Card Upload', 'Income & Address', 'Lease Details', 'Verification Fee', 'Consent & Submit'];

            return (
              <div
                key={s}
                onClick={() => {
                  if (isDone) setCurrentStep(s);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isDone ? 'pointer' : 'default',
                  zIndex: 2,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isCurrent
                      ? 'var(--color-primary)'
                      : isDone
                      ? '#16A34A'
                      : 'var(--color-surface-subtle)',
                    color: isCurrent || isDone ? 'white' : 'var(--color-text-muted)',
                    border: isCurrent ? '3px solid #BFDBFE' : '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isDone ? <Check size={16} strokeWidth={3} /> : s}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--color-primary)' : isDone ? '#16A34A' : 'var(--color-text-muted)',
                    marginTop: 6,
                    textAlign: 'center',
                    display: 'none',
                  }}
                >
                  {labels[s - 1]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <div
          className="card"
          style={{
            padding: 24,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'white',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* STEP 1: Instructions, Privacy Notice & Optional Property Dropdown & Personal Details */}
          {currentStep === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Instructions & Security Vault Highlight Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(0, 102, 255, 0.04)',
                  border: '1px solid rgba(0, 102, 255, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontWeight: 800, fontSize: 14 }}>
                  <ShieldCheck size={18} />
                  <span>Applicant Instructions & Privacy Safeguards</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-navy-dark)', marginTop: 8, lineHeight: 1.5, marginBottom: 0 }}>
                  {portalData.instructions ||
                    'Welcome to the verified Blue Sky Rental Intake. Please complete all 6 steps with your authentic legal identification and income proofs. Your submitted information is transmitted via 256-bit TLS encryption and strictly governed under our Fair Housing and Privacy policies.'}
                </p>

                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <Lock size={12} color="var(--color-primary)" />
                    <span>AES-256 Vault Encryption</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <FileCheck2 size={12} color="#16A34A" />
                    <span>FCRA Background Compliant</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <Globe size={12} color="#8B5CF6" />
                    <span>Equal Housing Opportunity</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Property Dropdown (Visible ONLY if properties are assigned to this link) */}
              {portalData.has_assigned_properties && portalData.assigned_properties.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                    Select Target Property / Residence
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      const matched = portalData.assigned_properties.find((p: any) => p.id === e.target.value);
                      if (matched?.units?.length > 0) {
                        setSelectedUnitId(matched.units[0].id);
                      } else {
                        setSelectedUnitId('');
                      }
                    }}
                    className="form-input"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-navy-dark)' }}
                  >
                    {portalData.assigned_properties.map((prop: any) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title} — {prop.street_address}, {prop.city} ({prop.property_type})
                      </option>
                    ))}
                  </select>

                  {/* If property has multiple units, allow selecting the specific unit */}
                  {selectedPropertyObj?.units && selectedPropertyObj.units.length > 1 && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Select Unit
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="form-input"
                        style={{ fontSize: 13 }}
                      >
                        {selectedPropertyObj.units.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_number_or_name} — ${u.rent_amount}/mo ({u.bedrooms} Bed, {u.bathrooms} Bath)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Applicant Personal Details */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 12 }}>
                  Personal Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Full Legal Name (as on ID) *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah.jenkins@example.com"
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 234-5678"
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Country of Citizenship / Residence *
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="form-input"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Other">Other International</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Identification Uploads */}
          {currentStep === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Government-Issued Photo ID
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Upload clear, high-resolution front and back photos of your legal identification.
                </p>
              </div>

              {/* ID Type Selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                  Select Document Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  {[
                    { id: 'drivers_license', label: "Driver's License" },
                    { id: 'national_id', label: 'National ID Card' },
                    { id: 'passport', label: 'Passport Book' },
                    { id: 'residence_permit', label: 'Permanent Resident Card' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setIdType(t.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: idType === t.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: idType === t.id ? 'rgba(0, 102, 255, 0.06)' : 'var(--color-white)',
                        color: idType === t.id ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Front & Back Upload Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Front Side */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                    Front Side Photo *
                  </label>
                  <input
                    type="file"
                    ref={frontInputRef}
                    onChange={(e) => handleGenericFileUpload(e, setIdFrontFile)}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                  />

                  {idFrontFile ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #86EFAC',
                        backgroundColor: '#F0FDF4',
                        position: 'relative',
                      }}
                    >
                      {idFrontFile.previewUrl && (
                        <img
                          src={idFrontFile.previewUrl}
                          alt="ID Front"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idFrontFile.name}
                        </div>
                        <button
                          onClick={() => setIdFrontFile(null)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => frontInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'var(--color-surface-subtle)',
                      }}
                    >
                      <Upload size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        Upload ID Front
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        JPG, PNG, or PDF up to 10MB
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Side */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                    Back Side Photo *
                  </label>
                  <input
                    type="file"
                    ref={backInputRef}
                    onChange={(e) => handleGenericFileUpload(e, setIdBackFile)}
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                  />

                  {idBackFile ? (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #86EFAC',
                        backgroundColor: '#F0FDF4',
                        position: 'relative',
                      }}
                    >
                      {idBackFile.previewUrl && (
                        <img
                          src={idBackFile.previewUrl}
                          alt="ID Back"
                          style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                        />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idBackFile.name}
                        </div>
                        <button
                          onClick={() => setIdBackFile(null)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => backInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 24,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'var(--color-surface-subtle)',
                      }}
                    >
                      <Upload size={24} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
                        Upload ID Back
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        JPG, PNG, or PDF up to 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SSN & Income & Residential Information */}
          {currentStep === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Financial & Residential Information
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Provide your SSN / National Tax ID, employer details, monthly income, and current residential address.
                </p>
              </div>

              {/* SSN Input */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                  Social Security Number (SSN) / National ID *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSsn ? 'text' : 'password'}
                    value={ssnNumber}
                    onChange={(e) => setSsnNumber(e.target.value)}
                    placeholder="XXX-XX-XXXX"
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSsn(!showSsn)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showSsn ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Encrypted at rest. Utilized solely for background screening under Fair Credit Reporting Act.
                </div>
              </div>

              {/* Employer & Income */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Current Employer / Company *
                  </label>
                  <input
                    type="text"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    placeholder="e.g. Apex Health Systems"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Job Title / Occupation *
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Registered Nurse"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Monthly Gross Income ($ USD) *
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 6500"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Current Residential Address *
                  </label>
                  <input
                    type="text"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    placeholder="e.g. 450 Maple Ave, Apt 3B, Dallas, TX"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Lease Preferences */}
          {currentStep === 4 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Lease Terms & Preferences
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Specify your ideal move-in timeframe, lease duration, and occupant details.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Desired Move-In Date *
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Lease Duration *
                  </label>
                  <select
                    value={leaseMonths}
                    onChange={(e) => setLeaseMonths(e.target.value)}
                    className="form-input"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (Standard)</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Number of Occupants *
                  </label>
                  <select
                    value={occupants}
                    onChange={(e) => setOccupants(e.target.value)}
                    className="form-input"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4+ People</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Do you have pets?
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" checked={!hasPets} onChange={() => setHasPets(false)} />
                      No Pets
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" checked={hasPets} onChange={() => setHasPets(true)} />
                      Yes, I have pets
                    </label>
                  </div>
                </div>

                {hasPets && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                      Pet Details (Breed, Age, Weight)
                    </label>
                    <input
                      type="text"
                      value={petsDescription}
                      onChange={(e) => setPetsDescription(e.target.value)}
                      placeholder="e.g. 1 Golden Retriever, 4 years old, 55 lbs"
                      className="form-input"
                    />
                  </div>
                )}

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 4 }}>
                    Additional Requests / Special Notes (Optional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="e.g. Parking space requested, moving from out of state..."
                    style={{
                      width: '100%',
                      minHeight: 60,
                      padding: 10,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Verification Fee & Payment Method */}
          {currentStep === 5 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Application Verification Fee
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Comprehensive background check, credit evaluation, and legal verification processing.
                </p>
              </div>

              {portalData.fee_enabled ? (
                <>
                  {/* Fee Summary Box */}
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Verification Fee</span>
                      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-navy-dark)', marginTop: 2 }}>
                        ${portalData.fee_amount || 50} <span style={{ fontSize: 13, fontWeight: 600 }}>{portalData.currency_code || 'USD'}</span>
                      </div>
                    </div>
                    <Badge variant="warning">Pending Remittance</Badge>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 8 }}>
                      Choose Remittance Method
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      {paymentMethods.map((m) => {
                        const isSelected = selectedMethodId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMethodId(m.id)}
                            style={{
                              padding: 12,
                              borderRadius: 'var(--radius-md)',
                              border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: isSelected ? 'rgba(0, 102, 255, 0.06)' : 'white',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-navy-dark)' }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                              {m.account_name || m.account_number || m.instructions || 'Direct payment details'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Proof Receipt Upload */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-navy-dark)', display: 'block', marginBottom: 6 }}>
                      Upload Payment Confirmation Receipt *
                    </label>
                    <input
                      type="file"
                      ref={proofInputRef}
                      onChange={(e) => handleGenericFileUpload(e, setProofPaymentFile, 'payment-proofs-vault')}
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                    />

                    {proofPaymentFile ? (
                      <div style={{ padding: 12, borderRadius: 'var(--radius-md)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {proofPaymentFile.name}
                        </span>
                        <button onClick={() => setProofPaymentFile(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => proofInputRef.current?.click()}
                        style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <Upload size={22} color="var(--color-primary)" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Wire / App Screenshot</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>JPG, PNG or PDF proof of payment</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', textAlign: 'center' }}>
                  <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#166534', margin: 0 }}>No Application Fee Required</h3>
                  <p style={{ fontSize: 12, color: '#15803D', marginTop: 4, marginBottom: 0 }}>
                    This portal campaign has waived the applicant background check fee. You may proceed directly to legal certification.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Legal Certification, Consent & Disclosures */}
          {currentStep === 6 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)', margin: 0 }}>
                  Legal Certification & Consent
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Please review and accept our fair housing disclosures, privacy agreement, and background check authorization.
                </p>
              </div>

              {/* Consent Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTruth}
                    onChange={(e) => setAgreedToTruth(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                    <strong>Certification of Accuracy:</strong> I certify that all statements made in this application are true, correct, and complete. I understand that false or misleading statements may lead to immediate disqualification.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToScreening}
                    onChange={(e) => setAgreedToScreening(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                    <strong>Background & Credit Authorization:</strong> I authorize Blue Sky Property Management and its verified screening partners to verify my employment, credit records, criminal background, and previous landlord references under the Fair Credit Reporting Act (FCRA).
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.4 }}>
                    <strong>Privacy & Data Usage Consent:</strong> I have read and agree to the{' '}
                    <Link href="/privacy" target="_blank" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Privacy Policy
                    </Link>
                    ,{' '}
                    <Link href="/terms" target="_blank" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Terms of Service
                    </Link>
                    , and{' '}
                    <Link href="/policies" target="_blank" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                      Data Security Vault Policies
                    </Link>
                    .
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="btn btn-outline"
                style={{ fontWeight: 600 }}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!canProceed()}
                className="btn btn-primary"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Continue Step {currentStep + 1} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={!canProceed() || isSubmitting}
                className="btn btn-primary"
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#16A34A',
                  borderColor: '#16A34A',
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Submit Verified Application
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
