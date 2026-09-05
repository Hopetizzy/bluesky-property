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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { store } from '@/lib/store';
import { propertiesDb } from '@/lib/db';
import { notifyNewApplication, notifyPaymentUploaded } from '@/lib/notificationService';
import { Property, PropertyUnit, RentalApplication, PaymentMethod, ApplicationFeeSettings, DocumentType, ApplicationDocument } from '@/lib/types';

interface UploadedFileRecord {
  name: string;
  size: string;
  bytes: number;
  type: string;
  previewUrl?: string;
  storagePath?: string;
  fromVault?: boolean;
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '1.2 MB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ApplyForPropertyPage() {
  const router = useRouter();
  const { slug, unitId } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Authenticated Profile State
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Application Fee Settings & Payment Methods
  const [feeSettings, setFeeSettings] = useState<ApplicationFeeSettings>({
    is_enabled: true,
    amount: 50,
    currency_code: 'USD',
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  // Step 1: Personal Details (Auto-prefilled from user account)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('United States');

  // Step 2: Identification Card Selection & Uploads
  const [idType, setIdType] = useState<'drivers_license' | 'national_id' | 'passport' | 'residence_permit'>('drivers_license');
  const [idFrontFile, setIdFrontFile] = useState<UploadedFileRecord | null>(null);
  const [idBackFile, setIdBackFile] = useState<UploadedFileRecord | null>(null);

  // Step 3: Supporting Documents (SSN, Income, Address)
  const [ssnNumber, setSsnNumber] = useState('');
  const [showSsn, setShowSsn] = useState(false);
  const [employer, setEmployer] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [incomeDoc, setIncomeDoc] = useState<UploadedFileRecord | null>(null);
  const [addressDoc, setAddressDoc] = useState<UploadedFileRecord | null>(null);

  // Step 4: Lease Terms & Preferences
  const [moveInDate, setMoveInDate] = useState('');
  const [leaseMonths, setLeaseMonths] = useState('12');
  const [occupants, setOccupants] = useState('1');
  const [hasPets, setHasPets] = useState(false);
  const [petsDescription, setPetsDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Step 5: Application Verification Fee & Proof
  const [proofPaymentFile, setProofPaymentFile] = useState<UploadedFileRecord | null>(null);

  // Step 6: Legal Certification
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Modal
  const [previewModalFile, setPreviewModalFile] = useState<{ name: string; title: string; previewUrl?: string; isImage?: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // File Inputs Refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const incomeInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Load Property, Authenticated Profile & Vault Documents
  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setIsLoadingAuth(true);

      try {
        // 1. Fetch Property (DB or Store)
        const found = await propertiesDb.getPropertyBySlug(slug as string);
        if (found) {
          setProperty(found);
          const matchedUnit = found.units.find(
            (u) => u.id === unitId || String(u.id).toLowerCase() === String(unitId).toLowerCase()
          ) || found.units[0];
          setSelectedUnit(matchedUnit);
        }

        // 2. Fetch Live Application Fee Settings & Payment Methods
        try {
          const feeRes = await fetch('/api/settings/application-fee');
          const feeJson = await feeRes.json();
          if (feeJson.success && feeJson.data) {
            setFeeSettings(feeJson.data as ApplicationFeeSettings);
          } else {
            setFeeSettings(store.getApplicationFeeSettings());
          }
        } catch {
          setFeeSettings(store.getApplicationFeeSettings());
        }

        try {
          const pmRes = await fetch('/api/admin/payment-methods');
          const pmJson = await pmRes.json();
          if (pmJson.success && Array.isArray(pmJson.data) && pmJson.data.length > 0) {
            const active = pmJson.data.filter((m: any) => m.is_active);
            setPaymentMethods(active);
            if (active.length > 0) setSelectedMethodId(active[0].id);
          } else {
            const localMethods = store.getPaymentMethods().filter((m) => m.is_active);
            setPaymentMethods(localMethods);
            if (localMethods.length > 0) setSelectedMethodId(localMethods[0].id);
          }
        } catch {
          const localMethods = store.getPaymentMethods().filter((m) => m.is_active);
          setPaymentMethods(localMethods);
          if (localMethods.length > 0) setSelectedMethodId(localMethods[0].id);
        }

        // 3. Fetch Logged-in User Profile & Enforce Auth Guard
        let authenticatedUser: any = null;
        if (isSupabaseConfigured()) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) authenticatedUser = user;
        }

        if (!authenticatedUser) {
          const localUser = store.getCurrentUser();
          if (localUser && localUser.id) {
            authenticatedUser = {
              id: localUser.id,
              email: localUser.email,
              user_metadata: { full_name: localUser.full_name },
            };
          }
        }

        if (!authenticatedUser) {
          const currentPath = router.asPath || `/properties/${slug}/apply${unitId ? `?unitId=${unitId}` : ''}`;
          router.replace(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        const user = authenticatedUser;
        setUserId(user.id);
        const userEmail = user.email || '';
        setEmail(userEmail);

        if (isSupabaseConfigured()) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .or(`auth_user_id.eq.${user.id},email.eq.${userEmail}`)
            .maybeSingle();

          if (profile) {
            setProfileId(profile.id);
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone) setPhone(profile.phone);
          } else if (user.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
            if (user.user_metadata.phone) setPhone(user.user_metadata.phone);
          }
        } else if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }

        // 4. Auto-Fetch existing documents from user's vault
        const storageKey = `bluesky_vault_documents_${userEmail}`;
        const savedDocsStr = localStorage.getItem(storageKey);
        if (savedDocsStr) {
          try {
            const vaultDocs = JSON.parse(savedDocsStr);
            if (Array.isArray(vaultDocs)) {
              const foundId = vaultDocs.find((d: any) => d.type === 'passport' || d.type === 'drivers_license' || d.type === 'national_id');
              if (foundId) {
                const frontStorage = foundId.storage_path || `/vault/${userEmail}/${foundId.name}`;
                const frontPreview = foundId.previewUrl || resolveDocumentUrl(frontStorage, foundId.name);
                setIdFrontFile({
                  name: foundId.name,
                  size: foundId.size || '1.8 MB',
                  bytes: foundId.bytes || 1800000,
                  type: foundId.mime_type || 'image/jpeg',
                  previewUrl: frontPreview,
                  storagePath: frontStorage,
                  fromVault: true,
                });

                const backName = foundId.backName || `${foundId.name.split('.')[0]}_back.jpg`;
                const backStorage = foundId.back_storage_path || `/vault/${userEmail}/${backName}`;
                const backPreview = foundId.backPreviewUrl || resolveDocumentUrl(backStorage, backName);
                setIdBackFile({
                  name: backName,
                  size: '1.4 MB',
                  bytes: 1400000,
                  type: 'image/jpeg',
                  previewUrl: backPreview,
                  storagePath: backStorage,
                  fromVault: true,
                });
              }
              const foundIncome = vaultDocs.find((d: any) => d.type === 'proof_of_income' || d.type === 'employment_letter' || d.type === 'bank_statement');
              if (foundIncome) {
                const incStorage = foundIncome.storage_path || `/vault/${userEmail}/${foundIncome.name}`;
                const incPreview = foundIncome.previewUrl || resolveDocumentUrl(incStorage, foundIncome.name);
                setIncomeDoc({
                  name: foundIncome.name,
                  size: foundIncome.size || '2.2 MB',
                  bytes: foundIncome.bytes || 2200000,
                  type: foundIncome.mime_type || 'application/pdf',
                  previewUrl: incPreview,
                  storagePath: incStorage,
                  fromVault: true,
                });
              }
              const foundAddress = vaultDocs.find((d: any) => d.type === 'utility_bill_address');
              if (foundAddress) {
                const addrStorage = foundAddress.storage_path || `/vault/${userEmail}/${foundAddress.name}`;
                const addrPreview = foundAddress.previewUrl || resolveDocumentUrl(addrStorage, foundAddress.name);
                setAddressDoc({
                  name: foundAddress.name,
                  size: foundAddress.size || '1.1 MB',
                  bytes: foundAddress.bytes || 1100000,
                  type: foundAddress.mime_type || 'application/pdf',
                  previewUrl: addrPreview,
                  storagePath: addrStorage,
                  fromVault: true,
                });
              }
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Apply page init note:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    loadData();
  }, [slug, unitId]);

  if (!property) {
    return (
      <AppLayout title="Apply | Blue Sky Property">
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Loading verified property application...</p>
        </div>
      </AppLayout>
    );
  }

  // Enhanced File Upload Handler with instant persistent Data URL preview, exact file size, and background vault sync
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
        fromVault: false,
      });

      // Convert to Base64 Data URL for persistent in-memory/localStorage preview
      const reader = new FileReader();
      reader.onload = async (uploadEvt) => {
        const dataUrl = uploadEvt.target?.result as string;
        setter((prev) => (prev ? { ...prev, previewUrl: dataUrl } : null));

        // Sync to backend storage vault in background
        try {
          const res = await fetch('/api/vault/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: dataUrl,
              bucket,
              folder: email ? `vault_${email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'vault',
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
          console.warn('Vault upload background sync note:', uploadErr);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step Validation Logic
  const isStep1Valid = Boolean(fullName.trim() && phone.trim() && email.trim() && dob && nationality.trim());
  const isStep2Valid = Boolean(idFrontFile && idBackFile);
  const isStep3Valid = Boolean(ssnNumber.trim() && employer.trim() && occupation.trim() && monthlyIncome.trim() && currentAddress.trim() && incomeDoc && addressDoc);
  const isStep4Valid = Boolean(moveInDate && leaseMonths && occupants);
  const isStep5Valid = feeSettings.is_enabled ? Boolean(selectedMethodId && proofPaymentFile) : true;
  const isStep6Valid = Boolean(agreedToTerms);

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    if (currentStep === 4) return isStep4Valid;
    if (currentStep === 5) return isStep5Valid;
    if (currentStep === 6) return isStep6Valid;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    } else {
      router.back();
    }
  };

  const handleSubmitApplication = async () => {
    if (!agreedToTerms || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const applicationRef = `BS-${Math.floor(100000 + Math.random() * 900000)}`;
      const newAppId = `app-${Date.now()}`;
      let createdDbAppId = newAppId;

      // 1. Prepare Application Record
      const newApp: RentalApplication = {
        id: newAppId,
        application_ref: applicationRef,
        applicant_id: profileId || userId || 'user-1',
        applicant_name: fullName,
        applicant_email: email,
        applicant_phone: phone,
        applicant_dob: dob,
        applicant_nationality: nationality,
        applicant_address: currentAddress,
        applicant_employer: employer,
        applicant_occupation: occupation,
        applicant_income: parseFloat(monthlyIncome) || 0,
        applicant_ssn: ssnNumber,
        property_id: property.id,
        property_title: property.title,
        property_address: `${property.street_address}, ${property.city}, ${property.state_province}`,
        property_image:
          property.images?.find((i) => i.is_primary)?.storage_path ||
          property.images?.[0]?.storage_path ||
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        unit_id: selectedUnit?.id || 'unit-1',
        unit_name: selectedUnit?.unit_number_or_name || 'Standard Unit',
        unit_rent: selectedUnit?.rent_amount || 0,
        unit_currency: selectedUnit?.currency_code || 'USD',
        status: 'submitted',
        desired_move_in: moveInDate,
        lease_term_months: parseInt(leaseMonths, 10) || 12,
        occupants_count: parseInt(occupants, 10) || 1,
        has_pets: hasPets,
        pets_description: hasPets ? petsDescription : undefined,
        additional_notes: additionalNotes,
        submitted_at: new Date().toISOString(),
        documents: [
          {
            id: `doc-${Date.now()}-1`,
            application_id: newAppId,
            document_type: idType as DocumentType,
            file_name: idFrontFile?.name || 'id_front.jpg',
            storage_path: idFrontFile?.storagePath || resolveDocumentUrl(`/vault/${email}/${idFrontFile?.name || 'id_front.jpg'}`),
            file_size_bytes: idFrontFile?.bytes || 1500000,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: `doc-${Date.now()}-2`,
            application_id: newAppId,
            document_type: idType as DocumentType,
            file_name: idBackFile?.name || 'id_back.jpg',
            storage_path: idBackFile?.storagePath || resolveDocumentUrl(`/vault/${email}/${idBackFile?.name || 'id_back.jpg'}`),
            file_size_bytes: idBackFile?.bytes || 1500000,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: `doc-${Date.now()}-3`,
            application_id: newAppId,
            document_type: 'proof_of_income',
            file_name: incomeDoc?.name || 'paystub.pdf',
            storage_path: incomeDoc?.storagePath || resolveDocumentUrl(`/vault/${email}/${incomeDoc?.name || 'income.pdf'}`),
            file_size_bytes: incomeDoc?.bytes || 2000000,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          {
            id: `doc-${Date.now()}-4`,
            application_id: newAppId,
            document_type: 'utility_bill_address',
            file_name: addressDoc?.name || 'utility_bill.pdf',
            storage_path: addressDoc?.storagePath || resolveDocumentUrl(`/vault/${email}/${addressDoc?.name || 'address.pdf'}`),
            file_size_bytes: addressDoc?.bytes || 1000000,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
          ...(feeSettings.is_enabled && proofPaymentFile
            ? [
                {
                  id: `doc-${Date.now()}-5`,
                  application_id: newAppId,
                  document_type: 'other' as DocumentType,
                  file_name: `Payment Proof - ${proofPaymentFile.name}`,
                  storage_path: proofPaymentFile.storagePath || resolveDocumentUrl(`/payments/app_${applicationRef}_proof_${proofPaymentFile.name}`),
                  file_size_bytes: proofPaymentFile.bytes || 1200000,
                  status: 'pending' as any,
                  created_at: new Date().toISOString(),
                },
              ]
            : []),
        ],
      };

      // 2. Insert into Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          // A. Insert rental application
          const { data: insertedApp, error: appInsertErr } = await supabase
            .from('rental_applications')
            .insert({
              application_ref: applicationRef,
              applicant_id: profileId,
              property_id: property.id,
              unit_id: selectedUnit?.id,
              applicant_name: fullName,
              applicant_email: email,
              applicant_phone: phone,
              applicant_dob: dob,
              applicant_nationality: nationality,
              applicant_address: currentAddress,
              applicant_employer: employer,
              applicant_occupation: occupation,
              applicant_income: parseFloat(monthlyIncome) || 0,
              applicant_ssn: ssnNumber,
              status: 'submitted',
              desired_move_in: moveInDate,
              lease_term_months: parseInt(leaseMonths, 10) || 12,
              occupants_count: parseInt(occupants, 10) || 1,
              has_pets: hasPets,
              pets_description: hasPets ? petsDescription : null,
              additional_notes: additionalNotes,
            })
            .select('id')
            .maybeSingle();

          if (insertedApp?.id) {
            createdDbAppId = String(insertedApp.id);
            newApp.id = createdDbAppId;
          }

          // B. Insert application documents into public.application_documents
          const docsToInsert = [
            {
              application_id: createdDbAppId,
              document_type: idType,
              file_name: idFrontFile?.name || 'id_front.jpg',
              storage_path: idFrontFile?.storagePath || resolveDocumentUrl(`/vault/${email}/${idFrontFile?.name || 'id_front.jpg'}`),
              file_size_bytes: idFrontFile?.bytes || 1500000,
              mime_type: idFrontFile?.type || 'image/jpeg',
              status: 'pending',
            },
            {
              application_id: createdDbAppId,
              document_type: idType,
              file_name: idBackFile?.name || 'id_back.jpg',
              storage_path: idBackFile?.storagePath || resolveDocumentUrl(`/vault/${email}/${idBackFile?.name || 'id_back.jpg'}`),
              file_size_bytes: idBackFile?.bytes || 1500000,
              mime_type: idBackFile?.type || 'image/jpeg',
              status: 'pending',
            },
            {
              application_id: createdDbAppId,
              document_type: 'proof_of_income',
              file_name: incomeDoc?.name || 'paystub.pdf',
              storage_path: incomeDoc?.storagePath || resolveDocumentUrl(`/vault/${email}/${incomeDoc?.name || 'income.pdf'}`),
              file_size_bytes: incomeDoc?.bytes || 2000000,
              mime_type: incomeDoc?.type || 'application/pdf',
              status: 'pending',
            },
            {
              application_id: createdDbAppId,
              document_type: 'utility_bill_address',
              file_name: addressDoc?.name || 'utility_bill.pdf',
              storage_path: addressDoc?.storagePath || resolveDocumentUrl(`/vault/${email}/${addressDoc?.name || 'address.pdf'}`),
              file_size_bytes: addressDoc?.bytes || 1000000,
              mime_type: addressDoc?.type || 'application/pdf',
              status: 'pending',
            },
            ...(feeSettings.is_enabled && proofPaymentFile
              ? [
                  {
                    application_id: createdDbAppId,
                    document_type: 'other' as any,
                    file_name: `Payment Proof - ${proofPaymentFile.name}`,
                    storage_path: proofPaymentFile.storagePath || resolveDocumentUrl(`/payments/app_${applicationRef}_proof_${proofPaymentFile.name}`),
                    file_size_bytes: proofPaymentFile.bytes || 1200000,
                    mime_type: proofPaymentFile.type || 'image/jpeg',
                    status: 'pending' as any,
                  },
                ]
              : []),
          ];

          await supabase.from('application_documents').insert(docsToInsert);

          // C. Insert payment record into public.application_payments
          if (feeSettings.is_enabled && proofPaymentFile) {
            const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);
            const proofPath = proofPaymentFile.storagePath || resolveDocumentUrl(`/payments/app_${applicationRef}_proof_${proofPaymentFile.name}`);
            await supabase.from('application_payments').insert({
              application_id: createdDbAppId,
              applicant_id: profileId,
              payment_method_id: selectedMethodId || null,
              payment_method_name: selectedMethod?.name || 'Verification Fee',
              amount: feeSettings.amount,
              currency_code: feeSettings.currency_code,
              proof_storage_path: proofPath,
              proof_file_name: proofPaymentFile.name,
              status: 'pending',
            });
          }

          // D. Automatically create dedicated Active Conversation Channel for this application
          const channelSubject = `Application #${applicationRef} - ${property.title}`;
          const { data: convData } = await supabase
            .from('conversations')
            .insert({
              property_id: property.id,
              application_id: createdDbAppId,
              applicant_id: profileId,
              subject: channelSubject,
              is_closed: false,
            })
            .select('id')
            .maybeSingle();

          if (convData?.id) {
            await supabase.from('messages').insert({
              conversation_id: convData.id,
              sender_id: profileId,
              is_admin: true,
              is_automated: true,
              message_body: `Application #${applicationRef} for ${property.title} (${selectedUnit?.unit_number_or_name || 'Unit'}) has been received and is currently under review by our verification team. Feel free to message us here with any questions.`,
            });
          }
        } catch (dbErr) {
          console.warn('DB submission note:', dbErr);
        }
      }

      // 3. Save to local store
      store.saveApplication(newApp);

      // 4. Automatically save uploaded documents to user's Encrypted ID Vault with persistent previews
      if (typeof window !== 'undefined' && email) {
        try {
          // Never persist heavy Base64 data URLs into browser LocalStorage (exceeds 5MB browser quota).
          // Save lightweight vault routing paths or server storage keys.
          const getSafeVaultPath = (rec: UploadedFileRecord | null, fallbackName: string) => {
            if (rec?.storagePath && !rec.storagePath.startsWith('data:')) {
              return rec.storagePath;
            }
            if (rec?.previewUrl && !rec.previewUrl.startsWith('data:')) {
              return rec.previewUrl;
            }
            const safeName = (rec?.name || fallbackName).replace(/[^a-zA-Z0-9._-]/g, '_');
            return `/vault/${email}/${safeName}`;
          };

          const vaultDocs = [
            {
              id: `doc-id-1`,
              title: `Government Photo ID (Front)`,
              name: idFrontFile?.name || 'id_front.jpg',
              status: 'verified',
              size: idFrontFile?.size || '1.8 MB',
              uploadedAt: new Date().toISOString().slice(0, 10),
              type: idType,
              previewUrl: getSafeVaultPath(idFrontFile, 'id_front.jpg'),
              storage_path: getSafeVaultPath(idFrontFile, 'id_front.jpg'),
            },
            {
              id: `doc-id-2`,
              title: `Government Photo ID (Back)`,
              name: idBackFile?.name || 'id_back.jpg',
              status: 'verified',
              size: idBackFile?.size || '1.5 MB',
              uploadedAt: new Date().toISOString().slice(0, 10),
              type: idType,
              previewUrl: getSafeVaultPath(idBackFile, 'id_back.jpg'),
              storage_path: getSafeVaultPath(idBackFile, 'id_back.jpg'),
            },
            {
              id: `doc-inc`,
              title: 'Proof of Income (Paystub / W2)',
              name: incomeDoc?.name || 'paystub.pdf',
              status: 'verified',
              size: incomeDoc?.size || '2.4 MB',
              uploadedAt: new Date().toISOString().slice(0, 10),
              type: 'proof_of_income',
              previewUrl: getSafeVaultPath(incomeDoc, 'income.pdf'),
              storage_path: getSafeVaultPath(incomeDoc, 'income.pdf'),
            },
            {
              id: `doc-addr`,
              title: 'Proof of Address (Utility Bill)',
              name: addressDoc?.name || 'utility_bill.pdf',
              status: 'verified',
              size: addressDoc?.size || '1.2 MB',
              uploadedAt: new Date().toISOString().slice(0, 10),
              type: 'utility_bill_address',
              previewUrl: getSafeVaultPath(addressDoc, 'address.pdf'),
              storage_path: getSafeVaultPath(addressDoc, 'address.pdf'),
            },
          ];

          const storageKey = `bluesky_vault_documents_${email}`;
          try {
            localStorage.setItem(storageKey, JSON.stringify(vaultDocs));
          } catch (storageQuotaErr) {
            console.warn('LocalStorage quota limit reached, clearing legacy heavy keys and retrying:', storageQuotaErr);
            localStorage.removeItem(storageKey);
            localStorage.setItem(storageKey, JSON.stringify(vaultDocs));
          }
        } catch (vaultErr) {
          console.warn('Non-blocking vault cache note:', vaultErr);
        }
      }

      // 5. Dispatch Event-Driven Notifications (Notifies Provider & Admin)
      try {
        await notifyNewApplication({
          applicationId: createdDbAppId,
          propertyId: property.id,
          propertyTitle: property.title,
          providerId: property.provider_id,
          tenantName: fullName,
          tenantEmail: email,
        });

        if (feeSettings.is_enabled && proofPaymentFile) {
          await notifyPaymentUploaded({
            paymentId: `pay_${createdDbAppId}`,
            userType: 'applicant',
            userEmail: email,
            userId: profileId || undefined,
            planOrPropertyTitle: property.title,
            amount: feeSettings.amount,
            currency: feeSettings.currency_code,
          });
        }
      } catch (notifErr) {
        console.warn('Notification dispatch note:', notifErr);
      }

      // 6. Redirect to Success Screen
      router.push(`/apply/success?ref=${applicationRef}&property=${encodeURIComponent(property.title)}`);
    } catch (err: any) {
      alert(`Submission error: ${err.message || 'Please verify form fields and try again.'}`);
      setIsSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];

  return (
    <AppLayout title={`Apply for ${property.title} | Blue Sky`} headerTitle="Apply for Property">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px 16px' }}>
        {/* Top Header & Property Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={handleBack}
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
            <ArrowLeft size={16} /> {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>
            Step <strong style={{ color: 'var(--color-primary)' }}>{currentStep}</strong> of 6
          </div>
        </div>

        {/* Selected Property Capsule */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-subtle)',
            }}
          >
            <img
              src={
                property.images?.find((i) => i.is_primary)?.storage_path ||
                property.images?.[0]?.storage_path ||
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
              }
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {property.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {property.street_address}, {property.city} • {selectedUnit?.unit_number_or_name || 'Unit 1'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-primary)' }}>
              ${selectedUnit?.rent_amount.toLocaleString()}/mo
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-success)', fontWeight: 700 }}>Verified Listing</span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 9999,
                backgroundColor: s <= currentStep ? 'var(--color-primary)' : '#E2E8F0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* =========================================================================
            STEP 1: PERSONAL DETAILS & APPLICATION FEE NOTICE
            ========================================================================= */}
        {currentStep === 1 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            {/* Verification Fee Prompt Notice */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                padding: '16px 20px',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                marginBottom: 24,
              }}
            >
              <Shield size={26} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E3A8A' }}>
                  Verification & Application Screening Notice
                </div>
                <p style={{ fontSize: 13, color: '#1E40AF', marginTop: 4, lineHeight: 1.5, margin: 0 }}>
                  Please note: An application verification fee of{' '}
                  <strong>
                    ${feeSettings.amount} {feeSettings.currency_code}
                  </strong>{' '}
                  is required in Step 5 before final submission to process certified background screening, income verification, and lock your application priority.
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              1. Applicant Personal Information
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Your account details have been automatically filled below. Feel free to update or adjust any field if needed.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  Full Legal Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <User size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Phone Number <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Phone size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Date of Birth <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Nationality / Citizenship <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. United States, Canada, United Kingdom"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: IDENTIFICATION CARD UPLOAD & INTERACTIVE PREVIEW
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              2. Government Identity Card Verification
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Select which identity document you would like to submit. Upload high-resolution scans of both front and back.
            </p>

            {/* ID Type Selection */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Select Identity Document Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { id: 'drivers_license', label: "Driver's License" },
                  { id: 'national_id', label: 'National ID Card' },
                  { id: 'passport', label: 'Passport (Photo Page)' },
                  { id: 'residence_permit', label: 'Residence Permit' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setIdType(type.id as any)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      border: idType === type.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: idType === type.id ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: idType === type.id ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontWeight: idType === type.id ? 800 : 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input type="file" ref={frontInputRef} onChange={(e) => handleGenericFileUpload(e, setIdFrontFile)} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />
            <input type="file" ref={backInputRef} onChange={(e) => handleGenericFileUpload(e, setIdBackFile)} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />

            {/* Front & Back Dropzones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Front Side */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 18, backgroundColor: 'var(--color-surface-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Front Side of ID <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                  {idFrontFile?.fromVault && <Badge variant="verified">Loaded from Vault</Badge>}
                </div>

                {idFrontFile ? (
                  <div style={{ backgroundColor: 'var(--color-white)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {idFrontFile.previewUrl ? (
                        <img src={idFrontFile.previewUrl} alt="Front ID" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                      ) : (
                        <CheckCircle2 size={24} color="var(--color-success)" />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idFrontFile.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{idFrontFile.size}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalFile({ name: idFrontFile.name, title: 'ID Card (Front Side)', previewUrl: idFrontFile.previewUrl, isImage: Boolean(idFrontFile.previewUrl) })}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => frontInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <RefreshCw size={14} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-white)',
                    }}
                  >
                    <Upload size={26} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Front Scan</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>JPG, PNG or PDF up to 10MB</div>
                  </div>
                )}
              </div>

              {/* Back Side */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 18, backgroundColor: 'var(--color-surface-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Back Side of ID <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                  {idBackFile?.fromVault && <Badge variant="verified">Loaded from Vault</Badge>}
                </div>

                {idBackFile ? (
                  <div style={{ backgroundColor: 'var(--color-white)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {idBackFile.previewUrl ? (
                        <img src={idBackFile.previewUrl} alt="Back ID" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                      ) : (
                        <CheckCircle2 size={24} color="var(--color-success)" />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idBackFile.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{idBackFile.size}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalFile({ name: idBackFile.name, title: 'ID Card (Back Side)', previewUrl: idBackFile.previewUrl, isImage: Boolean(idBackFile.previewUrl) })}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => backInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <RefreshCw size={14} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-white)',
                    }}
                  >
                    <Upload size={26} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Back Scan</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>JPG, PNG or PDF up to 10MB</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: SUPPORTING DOCUMENTS (SSN, INCOME, ADDRESS)
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              3. SSN, Employment & Proof of Income / Address
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Provide your employment background, SSN for credit background check, and supporting verification files.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* SSN Number */}
              <div className="form-group">
                <label className="form-label">
                  Social Security Number (SSN) / National ID Number <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSsn ? 'text' : 'password'}
                    className="form-input"
                    placeholder="XXX-XX-XXXX"
                    value={ssnNumber}
                    onChange={(e) => setSsnNumber(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSsn(!showSsn)}
                    style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 700 }}
                  >
                    {showSsn ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Monthly Income */}
              <div className="form-group">
                <label className="form-label">
                  Gross Monthly Income ($ USD) <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 7500"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    required
                  />
                  <DollarSign size={16} color="var(--color-text-muted)" style={{ position: 'absolute', right: 14, top: 14 }} />
                </div>
              </div>

              {/* Employer */}
              <div className="form-group">
                <label className="form-label">
                  Employer / Company Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Health Corp"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  required
                />
              </div>

              {/* Occupation */}
              <div className="form-group">
                <label className="form-label">
                  Occupation / Job Title <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Financial Analyst"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  required
                />
              </div>

              {/* Current Address */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Current Residential Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street Address, Apt/Suite, City, State, ZIP"
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Hidden File Inputs */}
            <input type="file" ref={incomeInputRef} onChange={(e) => handleGenericFileUpload(e, setIncomeDoc)} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />
            <input type="file" ref={addressInputRef} onChange={(e) => handleGenericFileUpload(e, setAddressDoc)} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />

            {/* Verification Documents Uploads */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Proof of Income */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 18, backgroundColor: 'var(--color-surface-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Proof of Income (Paystub / W-2) <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                  {incomeDoc?.fromVault && <Badge variant="verified">Loaded from Vault</Badge>}
                </div>

                {incomeDoc ? (
                  <div style={{ backgroundColor: 'var(--color-white)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {incomeDoc.previewUrl ? (
                        <img src={incomeDoc.previewUrl} alt="Income" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                      ) : (
                        <FileText size={24} color="var(--color-primary)" />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{incomeDoc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{incomeDoc.size}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalFile({ name: incomeDoc.name, title: 'Proof of Income', previewUrl: incomeDoc.previewUrl, isImage: Boolean(incomeDoc.previewUrl && incomeDoc.type.includes('image')) })}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => incomeInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <RefreshCw size={14} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => incomeInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-white)',
                    }}
                  >
                    <Upload size={26} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Paystub or Tax Return</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>PDF or Image up to 15MB</div>
                  </div>
                )}
              </div>

              {/* Proof of Current Address */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 18, backgroundColor: 'var(--color-surface-subtle)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Proof of Address (Utility Bill) <span style={{ color: 'var(--color-danger)' }}>*</span></span>
                  {addressDoc?.fromVault && <Badge variant="verified">Loaded from Vault</Badge>}
                </div>

                {addressDoc ? (
                  <div style={{ backgroundColor: 'var(--color-white)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {addressDoc.previewUrl ? (
                        <img src={addressDoc.previewUrl} alt="Address" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                      ) : (
                        <FileText size={24} color="var(--color-primary)" />
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addressDoc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{addressDoc.size}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalFile({ name: addressDoc.name, title: 'Proof of Address', previewUrl: addressDoc.previewUrl, isImage: Boolean(addressDoc.previewUrl && addressDoc.type.includes('image')) })}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <Eye size={14} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => addressInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, fontSize: 12 }}
                      >
                        <RefreshCw size={14} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => addressInputRef.current?.click()}
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-white)',
                    }}
                  >
                    <Upload size={26} color="var(--color-primary)" style={{ margin: '0 auto 6px auto' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Utility Bill or Lease</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>PDF or Image up to 15MB</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: LEASE TERMS & OCCUPANCY
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              4. Desired Lease Terms & Occupancy
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Specify your expected move-in timeline and household occupancy details.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  Desired Move-In Date <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Lease Duration <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <select className="form-select" value={leaseMonths} onChange={(e) => setLeaseMonths(e.target.value)}>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (Standard)</option>
                  <option value="18">18 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Total Number of Occupants</label>
                <select className="form-select" value={occupants} onChange={(e) => setOccupants(e.target.value)}>
                  <option value="1">1 Person (Just Me)</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4+ People</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Do you have pets?</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setHasPets(false)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: !hasPets ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: !hasPets ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: !hasPets ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    No Pets
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPets(true)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: hasPets ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: hasPets ? 'var(--color-primary-tint)' : 'var(--color-white)',
                      color: hasPets ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Yes, I have pets
                  </button>
                </div>
              </div>

              {hasPets && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Pet Breed & Weight Details</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1 Golden Retriever (25 lbs, trained)"
                    value={petsDescription}
                    onChange={(e) => setPetsDescription(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Additional Notes for Landlord / Property Manager</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Introduce yourself or mention any special preferences (parking, storage, etc.)..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: APPLICATION FEE & PAYMENT METHOD PROOF
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              5. Application Verification Fee & Payment
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Complete the verification fee payment and upload your transaction receipt/screenshot for admin confirmation.
            </p>

            {/* Step 5 Fee Clarity Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                padding: '20px 22px',
                borderRadius: 'var(--radius-xl)',
                marginBottom: 20,
              }}
            >
              <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                    Payment Summary
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-navy-dark)', marginTop: 2, marginBottom: 2 }}>
                    Application Verification & Screening Fee
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                    Covers applicant background identity check, credit score report, and underwriting processing.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary)' }}>
                    {feeSettings.is_enabled ? `$${feeSettings.amount} ${feeSettings.currency_code}` : 'FREE (Waived)'}
                  </div>
                  <Badge variant="verified" style={{ fontSize: 10, marginTop: 4 }}>DUE TODAY</Badge>
                </div>
              </div>

              {/* Crucial Clear Disclaimer for Tenants */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <Info size={20} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
                  <strong>Important Notice on Rent & Deposit:</strong> You are <strong>only paying the ${feeSettings.amount} application screening fee</strong> today. Monthly rental (${selectedUnit?.rent_amount?.toLocaleString()} {selectedUnit?.currency_code || 'USD'}) and security deposit (${(selectedUnit?.security_deposit || selectedUnit?.rent_amount || 0).toLocaleString()} USD) are <strong>never charged before you visit and inspect the property in person</strong>. They are payable only upon official lease signing after your application has been formally approved.
                </div>
              </div>
            </div>

            {feeSettings.is_enabled ? (
              <>
                {/* Payment Methods Selection */}
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label">Select Payment Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-lg)',
                          border: selectedMethodId === method.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: selectedMethodId === method.id ? 'var(--color-primary-tint)' : 'var(--color-white)',
                          color: selectedMethodId === method.id ? 'var(--color-primary)' : 'var(--color-navy-dark)',
                          fontWeight: selectedMethodId === method.id ? 800 : 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <CreditCard size={18} color={selectedMethodId === method.id ? 'var(--color-primary)' : 'var(--color-navy-muted)'} />
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Method Transfer Instructions */}
                {selectedMethod && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-primary-tint)',
                      border: '1px solid #BAE6FD',
                      padding: '18px 20px',
                      borderRadius: 'var(--radius-xl)',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={16} color="var(--color-primary)" />
                      Payment Instructions for {selectedMethod.name}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
                      {selectedMethod.instructions}
                    </p>

                    {/* Dedicated Bitcoin Crypto Display */}
                    {selectedMethod.type === 'bitcoin' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #BAE6FD', paddingTop: 14 }}>
                        {selectedMethod.account_name && (
                          <div className="flex-between">
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Recipient / Vault:</span>
                            <strong style={{ fontSize: 13, color: 'var(--color-navy-dark)' }}>{selectedMethod.account_name}</strong>
                          </div>
                        )}

                        {selectedMethod.account_number && (
                          <div style={{ backgroundColor: '#0F172A', padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid #334155' }}>
                            <div className="flex-between" style={{ marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Corporate Bitcoin (BTC) Cold-Storage Address:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedMethod.account_number!, 'btc')}
                                style={{
                                  background: copiedKey === 'btc' ? '#16A34A' : 'var(--color-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '3px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                {copiedKey === 'btc' ? <Check size={12} /> : <Copy size={12} />}
                                {copiedKey === 'btc' ? 'Copied!' : 'Copy Address'}
                              </button>
                            </div>
                            <div
                              style={{
                                fontFamily: 'monospace',
                                fontSize: 13,
                                fontWeight: 800,
                                color: '#38BDF8',
                                wordBreak: 'break-all',
                                overflowWrap: 'anywhere',
                                lineHeight: 1.4,
                              }}
                            >
                              {selectedMethod.account_number}
                            </div>
                          </div>
                        )}

                        {selectedMethod.routing_or_swift && (
                          <div className="flex-between" style={{ fontSize: 12 }}>
                            <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Blockchain Protocol:</span>
                            <strong style={{ color: 'var(--color-navy-dark)' }}>{selectedMethod.routing_or_swift}</strong>
                          </div>
                        )}
                        {selectedMethod.bank_name && (
                          <div className="flex-between" style={{ fontSize: 12 }}>
                            <span style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Network Platform:</span>
                            <strong style={{ color: 'var(--color-navy-dark)' }}>{selectedMethod.bank_name}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Standard / Non-Crypto Methods Display */
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, borderTop: '1px solid #BAE6FD', paddingTop: 14 }}>
                        {selectedMethod.account_name && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Recipient:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>{selectedMethod.account_name}</div>
                          </div>
                        )}
                        {selectedMethod.account_number && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                              {selectedMethod.type === 'cash_app'
                                ? 'Cash App $Cashtag:'
                                : selectedMethod.type === 'chime'
                                ? 'Chime Sign / Email:'
                                : selectedMethod.type === 'facebook_pay'
                                ? 'Meta Pay Handle:'
                                : selectedMethod.type === 'interac_etransfer'
                                ? 'Interac Auto-Deposit Email:'
                                : 'Account / Identifier:'}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', wordBreak: 'break-all' }}>{selectedMethod.account_number}</div>
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedMethod.account_number!, 'acct')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                                title="Copy"
                              >
                                {copiedKey === 'acct' ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedMethod.routing_or_swift && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Network / Routing:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-navy-dark)' }}>{selectedMethod.routing_or_swift}</div>
                          </div>
                        )}
                        {selectedMethod.type === 'zelle' && selectedMethod.zelle_identifier && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Zelle Identifier:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{selectedMethod.zelle_identifier}</div>
                          </div>
                        )}
                        {selectedMethod.type === 'paypal' && selectedMethod.paypal_email && (
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>PayPal Email:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{selectedMethod.paypal_email}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Proof of Payment Upload */}
                <input type="file" ref={proofInputRef} onChange={(e) => handleGenericFileUpload(e, setProofPaymentFile, 'payment-proofs-vault')} style={{ display: 'none' }} accept=".jpg,.jpeg,.png,.pdf" />

                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 20, backgroundColor: 'var(--color-surface-subtle)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                    Upload Proof of Payment (Receipt / Transfer Screenshot) <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </div>

                  {proofPaymentFile ? (
                    <div style={{ backgroundColor: 'var(--color-white)', padding: 14, borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {proofPaymentFile.previewUrl ? (
                          <img src={proofPaymentFile.previewUrl} alt="Receipt" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                        ) : (
                          <CheckCircle2 size={24} color="var(--color-success)" />
                        )}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proofPaymentFile.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{proofPaymentFile.size}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => setPreviewModalFile({ name: proofPaymentFile.name, title: 'Payment Receipt', previewUrl: proofPaymentFile.previewUrl, isImage: Boolean(proofPaymentFile.previewUrl) })}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: 12 }}
                        >
                          <Eye size={14} /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => proofInputRef.current?.click()}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, fontSize: 12 }}
                        >
                          <RefreshCw size={14} /> Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => proofInputRef.current?.click()}
                      style={{
                        border: '2px dashed #CBD5E1',
                        borderRadius: 'var(--radius-lg)',
                        padding: '28px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'var(--color-white)',
                      }}
                    >
                      <Upload size={30} color="var(--color-primary)" style={{ margin: '0 auto 8px auto' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-navy-dark)' }}>Upload Transaction Screenshot / Receipt</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>JPG, PNG or PDF up to 15MB</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: '#F0FDF4', borderRadius: 'var(--radius-xl)', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: '0 auto 10px auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#166534' }}>Application Fee Waived</h3>
                <p style={{ fontSize: 13, color: '#15803D', marginTop: 4, margin: 0 }}>
                  The verification fee for this property is currently sponsored. You may proceed directly to final review!
                </p>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STEP 6: FINAL REVIEW & SUBMISSION
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="animate-fade-in card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--color-white)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 6 }}>
              6. Review & Submit Application
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Verify all entered information and uploaded documents before final submission to Blue Sky property review.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {/* Summary 1: Applicant Info */}
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  Applicant Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div><strong>Name:</strong> {fullName}</div>
                  <div><strong>Email:</strong> {email}</div>
                  <div><strong>Phone:</strong> {phone}</div>
                  <div><strong>DOB:</strong> {dob}</div>
                  <div><strong>Nationality:</strong> {nationality}</div>
                  <div><strong>Address:</strong> {currentAddress}</div>
                </div>
              </div>

              {/* Summary 2: Employment & SSN */}
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  Employment & Verification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div><strong>Employer:</strong> {employer}</div>
                  <div><strong>Occupation:</strong> {occupation}</div>
                  <div><strong>Monthly Income:</strong> ${parseFloat(monthlyIncome || '0').toLocaleString()}/mo</div>
                  <div><strong>SSN / National ID:</strong> ••••-••-{ssnNumber.slice(-4) || 'XXXX'}</div>
                </div>
              </div>

              {/* Summary 3: Uploaded Documents */}
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  Attached Documents Vault
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <span><strong>ID Front:</strong> {idFrontFile?.name} ({idFrontFile?.size})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <span><strong>ID Back:</strong> {idBackFile?.name} ({idBackFile?.size})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} color="var(--color-primary)" />
                    <span><strong>Income:</strong> {incomeDoc?.name} ({incomeDoc?.size})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building size={16} color="var(--color-primary)" />
                    <span><strong>Address:</strong> {addressDoc?.name} ({addressDoc?.size})</span>
                  </div>
                  {feeSettings.is_enabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={16} color="var(--color-primary)" />
                      <span><strong>Fee Proof:</strong> {proofPaymentFile?.name} ({proofPaymentFile?.size})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary 4: Lease Terms */}
              <div style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '16px 20px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-navy-dark)', marginBottom: 8 }}>
                  Lease Terms
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div><strong>Desired Move-In:</strong> {moveInDate}</div>
                  <div><strong>Lease Duration:</strong> {leaseMonths} Months</div>
                  <div><strong>Occupants:</strong> {occupants}</div>
                  <div><strong>Pets:</strong> {hasPets ? `Yes (${petsDescription || 'Pets allowed'})` : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Legal Certification Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: 20,
              }}
            >
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'var(--color-navy-dark)', lineHeight: 1.5 }}>
                I certify that all information and uploaded documents provided are accurate, truthful, and complete. I authorize Blue Sky Property Management and the verified property owner to conduct background screening, income verification, and credit checks.
              </span>
            </label>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary"
              style={{ padding: '0 24px' }}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn btn-primary"
              style={{
                padding: '0 32px',
                opacity: canProceed() ? 1 : 0.5,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
              }}
            >
              Continue to Step {currentStep + 1} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={!canProceed() || isSubmitting}
              className="btn btn-primary btn-lg"
              style={{
                padding: '0 36px',
                opacity: canProceed() && !isSubmitting ? 1 : 0.5,
                cursor: canProceed() && !isSubmitting ? 'pointer' : 'not-allowed',
                boxShadow: '0 6px 20px rgba(0, 102, 255, 0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting Application...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submit Application
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Document Preview Modal with Full Image Rendering */}
      {previewModalFile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPreviewModalFile(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-2xl)',
              padding: 24,
              maxWidth: 580,
              width: '100%',
              boxShadow: 'var(--shadow-modal)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-navy-dark)' }}>
                {previewModalFile.title}
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy-dark)', display: 'flex', alignItems: 'center' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: 16,
                textAlign: 'center',
                border: '1px solid var(--color-border)',
                marginBottom: 16,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {previewModalFile.previewUrl && (previewModalFile.isImage || previewModalFile.previewUrl.startsWith('data:image') || !previewModalFile.name.toLowerCase().endsWith('.pdf')) ? (
                <img
                  src={previewModalFile.previewUrl}
                  alt={previewModalFile.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 340,
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <>
                  <FileText size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-navy-dark)' }}>{previewModalFile.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4, fontWeight: 700 }}>
                    ● Encrypted & Verified Ready for Review
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewModalFile(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
