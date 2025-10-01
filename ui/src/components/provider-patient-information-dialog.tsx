"use client"

import * as React from "react"
import {
  User,
  Heart,
  Calendar,
  Pill,
  FileText,
  Settings,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Activity,
  Maximize,
  Minimize,
  Save,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"
import { Button } from "./button"
import { MedicationCard } from "./medication-card"
import { VisitCard } from "./visit-card"
import { VisitClinicalNote, type ClinicalNoteData } from "./visit-clinical-note"
import { MedicationAdjustmentForm, type MedicationAdjustmentData } from "./medication-adjustment-form"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Label } from "./label"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Checkbox } from "./checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./tabs"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./sidebar"

export interface PatientMedicationPreference {
  id: string
  medication_name: string
  preferred_dosage: string
  frequency?: string
  status: 'pending' | 'approved' | 'denied' | 'discontinued'
  requested_date: string
  notes?: string
  faxed?: string | null
  next_prescription_due?: string | null
}

export interface PatientVisit {
  id: string
  appointment_date: string
  start_time: string
  appointment_type: string
  treatment_type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  provider_notes?: string
  patient_notes?: string
  addendums?: PatientVisitAddendum[]
}

export interface PatientVisitAddendum {
  id: string
  visit_id: string
  provider_id: string
  content: string
  created_at: string
}

export interface ProviderPatientData {
  id: string
  profile_id: string
  name: string
  email: string
  dateOfBirth?: string
  gender?: string
  patientId?: string
  phone?: string
  address?: string
  treatmentType?: string
  assignedDate?: string
  isPrimary?: boolean
  medicationPreferences?: PatientMedicationPreference[]
  visits?: PatientVisit[]
}

interface ProviderPatientInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: ProviderPatientData | null
  providerId?: string
  initialTab?: string
  initialVisitId?: string
  initialMedicationId?: string
  onMedicationUpdate?: (medicationId: string, updates: {
    status?: string
    dosage?: string
    frequency?: string
    providerNotes?: string
    faxed?: boolean
  }) => Promise<void>
}

const patientNavData = {
  nav: [
    { name: "Patient Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Visits", icon: Calendar },
    { name: "Tracking", icon: Activity },
  ],
}

export function ProviderPatientInformationDialog({
  open,
  onOpenChange,
  patient,
  providerId,
  initialTab,
  initialVisitId,
  initialMedicationId,
  onMedicationUpdate
}: ProviderPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(initialTab || "Patient Information")
  const [selectedMedication, setSelectedMedication] = React.useState<PatientMedicationPreference | null>(null)
  const [editedMedication, setEditedMedication] = React.useState<PatientMedicationPreference | null>(null)
  const [selectedVisit, setSelectedVisit] = React.useState<PatientVisit | null>(null)
  const [clinicalNoteData, setClinicalNoteData] = React.useState<ClinicalNoteData | null>(null)
  const [pendingMedicationChanges, setPendingMedicationChanges] = React.useState<MedicationAdjustmentData | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [visitsTab, setVisitsTab] = React.useState<'upcoming' | 'previous'>('upcoming')
  const [newAddendum, setNewAddendum] = React.useState('')
  const [isAddingAddendum, setIsAddingAddendum] = React.useState(false)
  const [existingClinicalNote, setExistingClinicalNote] = React.useState<any>(null)
  const [loadingClinicalNote, setLoadingClinicalNote] = React.useState(false)
  const [faxes, setFaxes] = React.useState<any[]>([])
  const [loadingFaxes, setLoadingFaxes] = React.useState(false)
  
  // Update activeTab when initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    } else {
      // Reset to default tab when initialTab is undefined (patient table click)
      setActiveTab("Patient Information")
      // Also clear any selected medication/visit state to reset breadcrumb
      setSelectedMedication(null)
      setEditedMedication(null)
      setSelectedVisit(null)
      setClinicalNoteData(null)
      setExistingClinicalNote(null)
      setPendingMedicationChanges(null)
      setNewAddendum('')
      setIsAddingAddendum(false)
    }
  }, [initialTab])

  // Auto-select visit when initialVisitId is provided
  React.useEffect(() => {
    if (initialVisitId && patient?.visits) {
      const visit = patient.visits.find(v => v.id === initialVisitId)
      if (visit) {
        handleVisitSelect(visit)
      }
    }
  }, [initialVisitId, patient?.visits])

  // Auto-select medication when initialMedicationId is provided
  React.useEffect(() => {
    if (initialMedicationId && patient?.medicationPreferences) {
      const medication = patient.medicationPreferences.find(m => m.id === initialMedicationId)
      if (medication) {
        handleMedicationSelect(medication)
      }
    }
  }, [initialMedicationId, patient?.medicationPreferences])

  // Clear selected items when switching between top-level tabs
  React.useEffect(() => {
    // When activeTab changes, clear any nested navigation state
    // This ensures breadcrumb shows the correct top-level section
    if (activeTab === "Patient Information" || activeTab === "Tracking") {
      setSelectedMedication(null)
      setEditedMedication(null)
      setSelectedVisit(null)
      setClinicalNoteData(null)
      setExistingClinicalNote(null)
      setPendingMedicationChanges(null)
      setNewAddendum('')
      setIsAddingAddendum(false)
    } else if (activeTab === "Medications") {
      // Clear visit-related state when switching to Medications tab
      setSelectedVisit(null)
      setClinicalNoteData(null)
      setExistingClinicalNote(null)
      setNewAddendum('')
      setIsAddingAddendum(false)
    } else if (activeTab === "Visits") {
      // Clear medication-related state when switching to Visits tab
      setSelectedMedication(null)
      setEditedMedication(null)
      setPendingMedicationChanges(null)
    }
  }, [activeTab])
  
  if (!patient) return null

  const getStartDate = (medication: PatientMedicationPreference) => {
    if (medication.status === 'approved') {
      return 'Started'
    }
    if (medication.status === 'pending' || medication.status === 'denied') {
      return 'Not started'
    }
    return 'Not started'
  }

  // Helper function to categorize visits
  const categorizeVisits = (visits: PatientVisit[] = []) => {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Reset time for date comparison
    
    const upcoming = visits.filter(visit => {
      const visitDate = new Date(visit.appointment_date)
      visitDate.setHours(0, 0, 0, 0)
      return visitDate >= currentDate && (visit.status === 'scheduled' || visit.status === 'confirmed')
    })
    
    const previous = visits.filter(visit => {
      const visitDate = new Date(visit.appointment_date)
      visitDate.setHours(0, 0, 0, 0)
      return visitDate < currentDate || visit.status === 'completed' || visit.status === 'cancelled' || visit.status === 'no_show'
    })
    
    return { upcoming, previous }
  }

  const { upcoming: upcomingVisits, previous: previousVisits } = categorizeVisits(patient.visits)

  const handleBackToMedications = () => {
    setSelectedMedication(null)
    setEditedMedication(null)
    setActiveTab("Medications")
  }

  const handleBackToVisits = () => {
    setSelectedVisit(null)
    setClinicalNoteData(null)
    setExistingClinicalNote(null)
    setPendingMedicationChanges(null) // Clear any unsaved medication changes
    setNewAddendum('')
    setIsAddingAddendum(false)
    setActiveTab("Visits")
  }

  const handleVisitSelect = async (visit: PatientVisit) => {
    setSelectedVisit(visit)
    setExistingClinicalNote(null)
    
    // Check if this is a previous visit - if so, try to fetch existing clinical note and addendums
    const isPreviousVisit = previousVisits.find(v => v.id === visit.id)
    
    if (isPreviousVisit) {
      setLoadingClinicalNote(true)
      try {
        // Import services dynamically to fetch existing note and addendums
        const { ClinicalNotesService, AddendumService } = await import('@joinomu/shared')
        
        // Fetch existing clinical note
        const existingNote = await ClinicalNotesService.getClinicalNoteByAppointmentId(visit.id)
        
        if (existingNote) {
          console.log('Found existing clinical note:', existingNote)
          setExistingClinicalNote(existingNote)
        } else {
          console.log('No existing clinical note found for appointment:', visit.id)
        }
        
        // Fetch existing addendums
        const addendums = await AddendumService.getAddendumsByVisitId(visit.id)
        console.log('Found addendums for visit:', addendums)
        
        // Update the visit object with addendums
        const updatedVisit = { 
          ...visit, 
          addendums: addendums.map(addendum => ({
            id: addendum.id,
            visit_id: addendum.visit_id,
            provider_id: addendum.provider_id,
            content: addendum.content,
            created_at: addendum.created_at
          }))
        }
        setSelectedVisit(updatedVisit)
        
      } catch (error) {
        console.warn('Error fetching existing clinical note or addendums:', error)
      } finally {
        setLoadingClinicalNote(false)
      }
    }
    
    // Initialize clinical note data for this visit (for upcoming visits or as fallback)
    setClinicalNoteData({
      appointmentId: visit.id,
      patientId: patient.id,
      providerId: providerId || '', // Use the provider ID passed from parent component
      allergies: [],
      previousMedications: [],
      currentMedications: [],
      clinicalNote: '',
      internalNote: '',
      visitSummary: ''
    })
  }

  const handleMedicationSelect = async (medication: PatientMedicationPreference) => {
    setSelectedMedication(medication)
    setEditedMedication({...medication})
    
    // Load faxes for this medication preference
    await loadFaxesForMedication(medication.id)
  }

  const loadFaxesForMedication = async (preferenceId: string) => {
    setLoadingFaxes(true)
    try {
      // Import services dynamically to fetch faxes
      const { supabase } = await import('@joinomu/shared')
      
      const { data: faxData, error } = await supabase
        .from('faxes')
        .select('*')
        .eq('preference_id', preferenceId)
        .order('faxed_at', { ascending: false })
      
      if (!error && faxData) {
        setFaxes(faxData)
      } else {
        console.warn('Error loading faxes:', error)
        setFaxes([])
      }
    } catch (error) {
      console.error('Error loading faxes:', error)
      setFaxes([])
    } finally {
      setLoadingFaxes(false)
    }
  }

  const handleSaveClinicalNote = async () => {
    if (!selectedVisit || !clinicalNoteData) return
    
    // Validate that we have a provider ID
    if (!providerId) {
      const { showToast } = await import('./toast')
      showToast({
        title: "Error saving clinical note",
        description: "Provider ID is required to save clinical notes.",
        variant: "error"
      })
      return
    }
    
    setIsSaving(true)
    try {
      // Import services dynamically to avoid circular dependencies
      const { ClinicalNotesService, supabase } = await import('@joinomu/shared')
      
      // Convert provider profile_id to database provider ID
      const { data: providerRecord, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', providerId)
        .single()

      if (providerError) {
        console.error('❌ Error looking up provider:', providerError)
        throw new Error(`Failed to lookup provider: ${providerError.message}`)
      }

      if (!providerRecord) {
        throw new Error('Provider not found in database')
      }

      console.log('✅ Found provider database ID:', providerRecord.id, 'for profile_id:', providerId)

      // Convert patient profile_id to database patient ID (patient.id might be profile_id)
      const { data: patientRecord, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', patient?.profile_id)
        .single()

      if (patientError) {
        console.error('❌ Error looking up patient:', patientError)
        throw new Error(`Failed to lookup patient: ${patientError.message}`)
      }

      if (!patientRecord) {
        throw new Error('Patient not found in database')
      }

      console.log('✅ Found patient database ID:', patientRecord.id, 'for profile_id:', patient?.profile_id)
      
      // Save the clinical note - transform camelCase to snake_case
      const savedNote = await ClinicalNotesService.upsertClinicalNote(selectedVisit.id, {
        appointment_id: clinicalNoteData.appointmentId,
        patient_id: patientRecord.id, // Use the database patient ID
        provider_id: providerRecord.id, // Use the database provider ID
        allergies: clinicalNoteData.allergies,
        previous_medications: clinicalNoteData.previousMedications,
        current_medications: clinicalNoteData.currentMedications,
        clinical_note: clinicalNoteData.clinicalNote,
        internal_note: clinicalNoteData.internalNote,
        visit_summary: clinicalNoteData.visitSummary
      })
      
      console.log('Clinical note saved:', savedNote)
      
      // If there are pending medication changes, save them
      if (pendingMedicationChanges && onMedicationUpdate) {
        try {
          await onMedicationUpdate(pendingMedicationChanges.id, {
            status: pendingMedicationChanges.status,
            dosage: pendingMedicationChanges.preferred_dosage,
            frequency: pendingMedicationChanges.frequency,
            providerNotes: pendingMedicationChanges.providerNotes
          })
          
          console.log('Pending medication changes saved as part of clinical note')
          
          // Clear pending changes after successful save
          setPendingMedicationChanges(null)
        } catch (medError) {
          console.error('Error updating medication preference:', medError)
        }
      }
      
      // Show success toast
      const { showToast } = await import('./toast')
      showToast({
        title: "Clinical note saved",
        description: "The clinical note and medication adjustments have been saved successfully.",
        variant: "success"
      })
      
      // Update the visit status to completed
      if (selectedVisit) {
        selectedVisit.status = 'completed'
      }
      
      // Navigate back to visits and switch to previous tab
      setVisitsTab('previous')
      handleBackToVisits()
    } catch (error) {
      console.error('Error saving clinical note:', error)
      
      // Show error toast
      const { showToast } = await import('./toast')
      showToast({
        title: "Error saving clinical note", 
        description: "There was an error saving the clinical note. Please try again.",
        variant: "error"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddendumSubmit = async () => {
    if (!selectedVisit || !newAddendum.trim() || !providerId) return
    
    setIsAddingAddendum(true)
    try {
      // Import AddendumService to save the addendum
      const { AddendumService } = await import('@joinomu/shared')
      
      console.log('Adding addendum for visit:', selectedVisit.id, 'Content:', newAddendum)
      
      // Save the addendum
      const savedAddendum = await AddendumService.createAddendum({
        visit_id: selectedVisit.id,
        provider_id: providerId,
        content: newAddendum.trim()
      })
      
      console.log('Addendum saved:', savedAddendum)
      
      // Update the selected visit with the new addendum
      const updatedAddendums = [
        ...(selectedVisit.addendums || []),
        {
          id: savedAddendum.id,
          visit_id: savedAddendum.visit_id,
          provider_id: savedAddendum.provider_id,
          content: savedAddendum.content,
          created_at: savedAddendum.created_at
        }
      ]
      
      setSelectedVisit(prev => prev ? { ...prev, addendums: updatedAddendums } : null)
      
      // Show success toast
      const { showToast } = await import('./toast')
      showToast({
        title: "Addendum added",
        description: "The addendum has been saved successfully.",
        variant: "success"
      })
      
      setNewAddendum('')
    } catch (error) {
      console.error('Error saving addendum:', error)
      
      const { showToast } = await import('./toast')
      showToast({
        title: "Error saving addendum",
        description: "There was an error saving the addendum. Please try again.",
        variant: "error"
      })
    } finally {
      setIsAddingAddendum(false)
    }
  }

  const handleFaxMedication = async (shouldFax: boolean) => {
    if (!editedMedication || !selectedMedication || !onMedicationUpdate || !providerId || !patient) return
    
    setIsSaving(true)
    try {
      if (shouldFax) {
        // Use the auth service method to create fax record with proper ID mapping
        const { authService } = await import('@joinomu/shared')
        
        // Check if we have the required profile IDs
        if (!patient.profile_id) {
          console.error('❌ Patient profile_id is missing:', patient)
          throw new Error('Patient profile_id is required for fax creation')
        }
        
        console.log('🔄 Creating fax with profile IDs:', {
          preferenceId: editedMedication.id,
          providerProfileId: providerId,  // This should be provider profile ID
          patientProfileId: patient.profile_id  // This should be patient profile ID
        })
        
        const faxResult = await authService.createMedicationApprovalAndFax(
          editedMedication.id,
          providerId,  // This should be provider profile ID
          patient.profile_id  // This should be patient profile ID
        )
        
        console.log('🔍 Fax creation result:', faxResult)
        
        if (faxResult.error) {
          console.error('❌ Fax creation failed with error:', faxResult.error)
          console.error('❌ Error details:', {
            message: faxResult.error.message,
            code: faxResult.error.code,
            details: faxResult.error.details,
            hint: faxResult.error.hint,
            stack: faxResult.error.stack
          })
          throw faxResult.error
        }
        
        // Update medication preference with faxed timestamp
        await onMedicationUpdate(editedMedication.id, {
          status: 'approved',
          dosage: editedMedication.preferred_dosage,
          frequency: editedMedication.frequency,
          providerNotes: editedMedication.providerNotes,
          faxed: true
        })
        
        // Update local state
        const updatedMedication = {
          ...editedMedication,
          status: 'approved' as const,
          faxed: new Date().toISOString()
        }
        setEditedMedication(updatedMedication)
        setSelectedMedication(updatedMedication)
        
        // Reload faxes to show the new one
        await loadFaxesForMedication(editedMedication.id)
        
        // Show success toast
        const { showToast } = await import('./toast')
        showToast({
          title: "Prescription faxed",
          description: "The prescription has been faxed to the pharmacy and an order will be created.",
          variant: "success"
        })
      } else {
        // Just update without faxing
        await onMedicationUpdate(editedMedication.id, {
          status: editedMedication.status,
          dosage: editedMedication.preferred_dosage,
          frequency: editedMedication.frequency,
          providerNotes: editedMedication.providerNotes
        })
        
        // Update the selected medication with the new data
        setSelectedMedication(editedMedication)
      }
    } catch (error) {
      console.error('❌ Error handling medication update:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error constructor:', error?.constructor?.name)
      
      // Log detailed error information
      if (error && typeof error === 'object') {
        console.error('❌ Error properties:', {
          message: (error as any).message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
          stack: (error as any).stack,
          name: (error as any).name
        })
      }
      
      const { showToast } = await import('./toast')
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as any).message 
        : "There was an error updating the medication. Please try again."
      
      showToast({
        title: "Error faxing medication",
        description: errorMessage,
        variant: "error"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMedication = async () => {
    await handleFaxMedication(false)
  }

  const hasChanges = editedMedication && selectedMedication && 
    (editedMedication.status !== selectedMedication.status ||
     editedMedication.preferred_dosage !== selectedMedication.preferred_dosage ||
     editedMedication.frequency !== selectedMedication.frequency ||
     editedMedication.providerNotes !== selectedMedication.providerNotes)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-hidden p-0 bg-card ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      }`}>
        <DialogTitle className="sr-only">Patient Information - Provider View</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information here from provider perspective.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {patientNavData.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeTab === item.name}
                          onClick={() => setActiveTab(item.name)}
                        >
                          <button>
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className={`flex flex-1 flex-col overflow-hidden bg-card ${
            isFullscreen ? "h-full" : "h-[480px]"
          }`}>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink 
                        href="#" 
                        onClick={() => {
                          setActiveTab("Patient Information")
                          setSelectedMedication(null)
                          setPendingMedicationChanges(null) // Clear any unsaved medication changes
                        }}
                      >
                        Patient Information
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    {selectedMedication ? (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#" onClick={handleBackToMedications}>
                            Medications
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{selectedMedication.medication_name}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : selectedVisit ? (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#" onClick={handleBackToVisits}>
                            Visits
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>Clinical Note</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {activeTab === "Patient Information" && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p>{patient.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{patient.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <p>{patient.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Patient ID:</span>
                        <p>{patient.patientId || patient.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>{patient.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <p>{patient.gender || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Treatment Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Treatment Type:</span>
                        <p>{patient.treatmentType || 'General Care'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned Date:</span>
                        <p>{patient.assignedDate || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Primary Provider:</span>
                        <p>{patient.isPrimary ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p>Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Medications" && (
                <div className="space-y-4">
                  {selectedMedication && editedMedication ? (
                    // Editable medication detail view within Medications tab
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Medication Details</CardTitle>
                          {hasChanges && (
                            <Button 
                              onClick={handleSaveMedication}
                              disabled={isSaving}
                              size="sm"
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Medication Name</Label>
                              <p className="text-lg font-semibold">{selectedMedication.medication_name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <Select 
                                value={editedMedication.status} 
                                onValueChange={(value) => setEditedMedication(prev => 
                                  prev ? {...prev, status: value as PatientMedicationPreference['status']} : null
                                )}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="denied">Denied</SelectItem>
                                  <SelectItem value="discontinued">Discontinued</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Dosage</Label>
                              <Input
                                value={editedMedication.preferred_dosage}
                                onChange={(e) => setEditedMedication(prev => 
                                  prev ? {...prev, preferred_dosage: e.target.value} : null
                                )}
                                placeholder="Enter dosage"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Frequency</Label>
                              <Input
                                value={editedMedication.frequency || ''}
                                onChange={(e) => setEditedMedication(prev => 
                                  prev ? {...prev, frequency: e.target.value} : null
                                )}
                                placeholder="Enter frequency"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Requested Date</Label>
                              <p>{new Date(selectedMedication.requested_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Start Date</Label>
                              <p>{getStartDate(selectedMedication)}</p>
                            </div>
                          </div>
                          
                          {/* Faxed checkbox */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="faxed"
                              checked={!!selectedMedication.faxed}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFaxMedication(true)
                                }
                              }}
                              disabled={isSaving || !!selectedMedication.faxed}
                            />
                            <Label htmlFor="faxed" className="text-sm font-medium">
                              Faxed to Pharmacy
                              {selectedMedication.faxed && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (Faxed on {new Date(selectedMedication.faxed).toLocaleDateString()})
                                </span>
                              )}
                            </Label>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Provider Notes</Label>
                            <Textarea
                              value={editedMedication.providerNotes || ''}
                              onChange={(e) => setEditedMedication(prev => 
                                prev ? {...prev, providerNotes: e.target.value} : null
                              )}
                              placeholder="Add provider notes..."
                              rows={3}
                            />
                          </div>
                          
                          {/* Fax History */}
                          {faxes.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Fax History</Label>
                              <div className="mt-2 space-y-2">
                                {loadingFaxes ? (
                                  <p className="text-sm text-muted-foreground">Loading fax history...</p>
                                ) : (
                                  faxes.map((fax) => (
                                    <div key={fax.id} className="p-3 bg-muted rounded-md">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-sm font-medium">
                                            Faxed to: {fax.fax_number}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(fax.faxed_at).toLocaleString()}
                                          </p>
                                          {fax.fax_content && (
                                            <p className="text-sm mt-1">{fax.fax_content}</p>
                                          )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          fax.fax_status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                          fax.fax_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                          fax.fax_status === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {fax.fax_status}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Medication list view
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h3 className="font-semibold mb-4">Patient Medication Preferences</h3>
                      {!patient.medicationPreferences || patient.medicationPreferences.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No medication preferences found for this patient.</p>
                      ) : (
                        <div className="space-y-4">
                          {patient.medicationPreferences.map((medication) => (
                            <MedicationCard
                              key={medication.id}
                              medicationName={medication.medication_name}
                              dosage={medication.preferred_dosage}
                              supply={medication.frequency || 'As needed'}
                              status={medication.status}
                              onClick={() => handleMedicationSelect(medication)}
                              className="w-full max-w-none cursor-pointer"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Visits" && !selectedVisit && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <Tabs value={visitsTab} onValueChange={(value) => setVisitsTab(value as 'upcoming' | 'previous')} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="previous">Previous</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upcoming" className="mt-4">
                        {upcomingVisits.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No upcoming appointments found for this patient.</p>
                        ) : (
                          <div className="space-y-4">
                            {upcomingVisits.map((visit) => (
                              <VisitCard
                                key={visit.id}
                                patientName={patient.name}
                                appointmentDate={visit.appointment_date}
                                appointmentTime={visit.start_time}
                                visitType={visit.appointment_type}
                                status={visit.status}
                                treatmentType={visit.treatment_type}
                                onClick={() => handleVisitSelect(visit)}
                                className="w-full max-w-none cursor-pointer"
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="previous" className="mt-4">
                        {previousVisits.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No previous appointments found for this patient.</p>
                        ) : (
                          <div className="space-y-4">
                            {previousVisits.map((visit) => (
                              <VisitCard
                                key={visit.id}
                                patientName={patient.name}
                                appointmentDate={visit.appointment_date}
                                appointmentTime={visit.start_time}
                                visitType={visit.appointment_type}
                                status={visit.status}
                                treatmentType={visit.treatment_type}
                                onClick={() => handleVisitSelect(visit)}
                                className="w-full max-w-none cursor-pointer"
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}

              {selectedVisit && clinicalNoteData && (
                <div className="space-y-4">
                  {/* Check if this is a previous visit (read-only) */}
                  {previousVisits.find(v => v.id === selectedVisit.id) ? (
                    // Read-only view for previous visits
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Visit Details - {(() => {
                            // Parse date safely to avoid timezone issues
                            const [year, month, day] = selectedVisit.appointment_date.split('-').map(Number)
                            const date = new Date(year, month - 1, day) // month is 0-indexed
                            return date.toLocaleDateString()
                          })()}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Patient:</span>
                              <p>{patient.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Appointment Time:</span>
                              <p>{selectedVisit.start_time}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Visit Type:</span>
                              <p>{selectedVisit.appointment_type}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <p className="capitalize">{selectedVisit.status}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Treatment Type:</span>
                              <p>{selectedVisit.treatment_type}</p>
                            </div>
                          </div>
                          
                          {selectedVisit.provider_notes && (
                            <div>
                              <Label className="text-sm font-medium">Provider Notes</Label>
                              <div className="mt-1 p-3 bg-muted rounded-md">
                                <p className="text-sm">{selectedVisit.provider_notes}</p>
                              </div>
                            </div>
                          )}
                          
                          {selectedVisit.patient_notes && (
                            <div>
                              <Label className="text-sm font-medium">Patient Notes</Label>
                              <div className="mt-1 p-3 bg-muted rounded-md">
                                <p className="text-sm">{selectedVisit.patient_notes}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Clinical Note Display */}
                      {loadingClinicalNote ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Clinical Note</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">Loading clinical note...</p>
                          </CardContent>
                        </Card>
                      ) : existingClinicalNote ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Clinical Note</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {existingClinicalNote.allergies && existingClinicalNote.allergies.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium">Allergies</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.allergies.join(', ')}</p>
                                </div>
                              </div>
                            )}
                            
                            {existingClinicalNote.previous_medications && existingClinicalNote.previous_medications.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium">Previous Medications</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.previous_medications.join(', ')}</p>
                                </div>
                              </div>
                            )}
                            
                            {existingClinicalNote.current_medications && existingClinicalNote.current_medications.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium">Current Medications</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.current_medications.join(', ')}</p>
                                </div>
                              </div>
                            )}
                            
                            {existingClinicalNote.clinical_note && (
                              <div>
                                <Label className="text-sm font-medium">Clinical Note</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.clinical_note}</p>
                                </div>
                              </div>
                            )}
                            
                            {existingClinicalNote.internal_note && (
                              <div>
                                <Label className="text-sm font-medium">Internal Note</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.internal_note}</p>
                                </div>
                              </div>
                            )}
                            
                            {existingClinicalNote.visit_summary && (
                              <div>
                                <Label className="text-sm font-medium">Visit Summary</Label>
                                <div className="mt-1 p-3 bg-muted rounded-md">
                                  <p className="text-sm">{existingClinicalNote.visit_summary}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(existingClinicalNote.created_at).toLocaleString()}
                              {existingClinicalNote.updated_at !== existingClinicalNote.created_at && (
                                <span> • Updated: {new Date(existingClinicalNote.updated_at).toLocaleString()}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle>Clinical Note</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">No clinical note found for this visit.</p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Addendums section */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Addendums</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Display existing addendums */}
                          {selectedVisit.addendums && selectedVisit.addendums.length > 0 ? (
                            <div className="space-y-3">
                              {selectedVisit.addendums
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((addendum) => (
                                <div key={addendum.id} className="p-3 bg-muted rounded-md">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(addendum.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{addendum.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No addendums for this visit.</p>
                          )}
                          
                          {/* Add new addendum */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Add Addendum</Label>
                            <Textarea
                              value={newAddendum}
                              onChange={(e) => setNewAddendum(e.target.value)}
                              placeholder="Enter addendum content..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleAddendumSubmit}
                                disabled={!newAddendum.trim() || isAddingAddendum}
                                size="sm"
                              >
                                {isAddingAddendum ? 'Adding...' : 'Add Addendum'}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={handleBackToVisits}
                                size="sm"
                              >
                                Back to Visits
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Editable view for upcoming visits
                    <VisitClinicalNote
                      visit={selectedVisit}
                      patientName={patient.name}
                      patientProfileId={patient.profile_id}
                      providerProfileId={providerId}
                      medication={pendingMedicationChanges || (patient.medicationPreferences && patient.medicationPreferences.length > 0 ? {
                        id: patient.medicationPreferences[0].id,
                        medication_name: patient.medicationPreferences[0].medication_name,
                        preferred_dosage: patient.medicationPreferences[0].preferred_dosage,
                        frequency: patient.medicationPreferences[0].frequency,
                        status: patient.medicationPreferences[0].status,
                        providerNotes: patient.medicationPreferences[0].notes,
                        faxed: patient.medicationPreferences[0].faxed
                      } : undefined)}
                      clinicalNote={clinicalNoteData}
                      onMedicationChange={(medication) => {
                        console.log('Medication changed locally:', medication)
                        // Store the medication changes locally, don't save to API yet
                        setPendingMedicationChanges(medication)
                      }}
                      onClinicalNoteChange={(note) => {
                        setClinicalNoteData(note)
                      }}
                      onMedicationFax={async (medicationId, shouldFax, patientProfileId, providerProfileId) => {
                        if (shouldFax && patientProfileId && providerProfileId) {
                          try {
                            setIsSaving(true)
                            // Import supabase for direct fax record creation
                            const { supabase } = await import('@joinomu/shared')
                            
                            // Find the medication from pending changes or patient preferences
                            const medication = pendingMedicationChanges || 
                              (patient.medicationPreferences && patient.medicationPreferences.find(m => m.id === medicationId))
                            
                            if (!medication) {
                              throw new Error('Medication not found')
                            }
                            
                            // Get the correct patient table ID and provider table ID first
                            console.log('🔍 Looking up patient with profile_id:', patientProfileId)
                            const { data: patientRecord, error: patientError } = await supabase
                              .from('patients')
                              .select('id')
                              .eq('profile_id', patientProfileId)
                              .single()
                            
                            console.log('🔍 Patient lookup result:', { patientRecord, patientError })
                            
                            console.log('🔍 Looking up provider with profile_id:', providerProfileId)
                            const { data: providerRecord, error: providerError } = await supabase
                              .from('providers')
                              .select('id')
                              .eq('profile_id', providerProfileId)
                              .single()
                            
                            console.log('🔍 Provider lookup result:', { providerRecord, providerError })
                            
                            if (patientError) {
                              throw new Error(`Failed to get patient table ID: ${patientError.message}`)
                            }
                            
                            if (providerError) {
                              throw new Error(`Failed to get provider table ID: ${providerError.message}`)
                            }
                            
                            if (!patientRecord || !providerRecord) {
                              throw new Error('Failed to get patient or provider table IDs')
                            }
                            
                            // Now find or create an approval for this preference
                            let approvalId = null
                            const { data: existingApproval } = await supabase
                              .from('medication_approvals')
                              .select('id')
                              .eq('preference_id', medicationId)
                              .single()
                            
                            if (existingApproval) {
                              approvalId = existingApproval.id
                            } else {
                              // Create an approval if none exists
                              const { data: newApproval, error: createApprovalError } = await supabase
                                .from('medication_approvals')
                                .insert({
                                  preference_id: medicationId,
                                  provider_id: providerRecord.id, // Legacy column (use table ID)
                                  provider_profile_id: providerProfileId, // New profile ID column
                                  status: 'approved',
                                  approval_date: new Date().toISOString(),
                                  provider_notes: medication.providerNotes || 'Approved and faxed during clinical visit',
                                  supply_days: medication.supply_days
                                })
                                .select('id')
                                .single()
                              
                              if (createApprovalError) {
                                throw createApprovalError
                              }
                              approvalId = newApproval.id
                            }
                            
                            // Create fax record (this will trigger order creation)
                            const { error: faxError } = await supabase
                              .from('faxes')
                              .insert({
                                approval_id: approvalId,
                                preference_id: medicationId,
                                patient_id: patientRecord.id, // Legacy column
                                provider_id: providerRecord.id, // Legacy column
                                patient_profile_id: patientProfileId, // New profile ID column
                                provider_profile_id: providerProfileId, // New profile ID column
                                fax_number: '1-800-PHARMACY',
                                fax_content: `Prescription for ${medication.medication_name} ${medication.preferred_dosage}`,
                                fax_status: 'sent',
                                faxed_at: new Date().toISOString()
                              })
                            
                            if (faxError) {
                              throw faxError
                            }
                            
                            // Update medication preference with faxed timestamp
                            if (onMedicationUpdate) {
                              await onMedicationUpdate(medicationId, {
                                status: 'approved',
                                faxed: true
                              })
                            }
                            
                            // Show success toast
                            const { showToast } = await import('./toast')
                            showToast({
                              title: "Prescription faxed",
                              description: "The prescription has been faxed to the pharmacy and an order will be created.",
                              variant: "success"
                            })
                            
                          } catch (error) {
                            console.error('Error faxing medication from clinical note:', error)
                            
                            const { showToast } = await import('./toast')
                            showToast({
                              title: "Error faxing medication",
                              description: "There was an error faxing the medication. Please try again.",
                              variant: "error"
                            })
                          } finally {
                            setIsSaving(false)
                          }
                        }
                      }}
                      onSave={handleSaveClinicalNote}
                      isSaving={isSaving}
                    />
                  )}
                </div>
              )}

              {activeTab === "Tracking" && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Health Tracking</h3>
                    <p className="text-sm text-muted-foreground">No tracking data available for this patient.</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}