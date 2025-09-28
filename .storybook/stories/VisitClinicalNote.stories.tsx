import type { Meta, StoryObj } from '@storybook/react'
import { VisitClinicalNote } from '@joinomu/ui'

const meta: Meta<typeof VisitClinicalNote> = {
  title: 'Atomic/Organisms/Patient Information/Provider/Visit Clinical Note',
  component: VisitClinicalNote,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onMedicationChange: { action: 'medication changed' },
    onClinicalNoteChange: { action: 'clinical note changed' },
    onSave: { action: 'clinical note saved' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample visit data
const sampleVisit = {
  id: 'visit-1',
  appointment_date: '2025-10-01',
  start_time: '14:30',
  appointment_type: 'Follow-up',
  treatment_type: 'weight_loss',
  status: 'completed' as const,
  provider_notes: 'Patient reported good progress with current treatment plan.',
  patient_notes: 'Feeling much better, some minor side effects.'
}

// Sample medication data
const sampleMedication = {
  id: 'med-1',
  medication_name: 'Semaglutide',
  preferred_dosage: '0.5mg',
  frequency: 'Weekly',
  status: 'approved' as const,
  providerNotes: 'Start with lower dose and monitor for side effects.'
}

// Sample clinical note data
const sampleClinicalNote = {
  appointmentId: 'visit-1',
  patientId: 'patient-1',
  providerId: 'provider-1',
  allergies: ['Penicillin', 'Shellfish'],
  previousMedications: ['Metformin', 'Lisinopril'],
  currentMedications: ['Multivitamin', 'Fish Oil'],
  clinicalNote: 'Patient shows excellent progress with weight loss goals. No significant side effects reported. Blood pressure stable.',
  internalNote: 'Consider increasing dose at next visit if weight loss plateaus.',
  visitSummary: 'Patient and I discussed their weight loss goals and Semaglutide 0.5mg was prescribed for Weekly. The patient should plan on a follow up visit in 30 days to continue their treatment.'
}

export const Default: Story = {
  args: {
    visit: sampleVisit,
    patientName: 'Sarah Johnson',
    medication: sampleMedication,
    clinicalNote: sampleClinicalNote,
  }
}

export const WithoutMedication: Story = {
  args: {
    visit: sampleVisit,
    patientName: 'Sarah Johnson',
    clinicalNote: {
      ...sampleClinicalNote,
      visitSummary: ''
    }
  }
}

export const EmptyClinicalNote: Story = {
  args: {
    visit: sampleVisit,
    patientName: 'Sarah Johnson',
    medication: sampleMedication,
    clinicalNote: {
      appointmentId: 'visit-1',
      patientId: 'patient-1',
      providerId: 'provider-1',
      allergies: [],
      previousMedications: [],
      currentMedications: [],
      clinicalNote: '',
      internalNote: '',
      visitSummary: ''
    }
  }
}

export const ScheduledVisit: Story = {
  args: {
    visit: {
      ...sampleVisit,
      status: 'scheduled' as const,
      appointment_date: '2025-10-15'
    },
    patientName: 'Sarah Johnson',
    medication: {
      ...sampleMedication,
      status: 'pending' as const
    },
    clinicalNote: {
      ...sampleClinicalNote,
      clinicalNote: '',
      visitSummary: ''
    }
  }
}

export const CompletedWithExtensiveNotes: Story = {
  args: {
    visit: sampleVisit,
    patientName: 'Sarah Johnson',
    medication: sampleMedication,
    clinicalNote: {
      ...sampleClinicalNote,
      allergies: ['Penicillin', 'Shellfish', 'Latex', 'Pollen'],
      previousMedications: ['Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole'],
      currentMedications: ['Multivitamin', 'Fish Oil', 'Vitamin D3', 'Magnesium'],
      clinicalNote: `Patient presents for follow-up appointment regarding weight loss treatment with Semaglutide. 

SUBJECTIVE:
- Reports good tolerance of current 0.5mg weekly dose
- Mild nausea during first 2 weeks, now resolved
- Lost 12 pounds since starting treatment 6 weeks ago
- Improved energy levels and mood
- No significant side effects currently

OBJECTIVE:
- Weight: 185 lbs (down from 197 lbs at start)
- BP: 128/82 mmHg
- Heart rate: 72 bpm
- Patient appears well, alert and oriented

ASSESSMENT:
- Excellent response to Semaglutide therapy
- Weight loss goal on track
- No concerning side effects

PLAN:
- Continue current dose of 0.5mg weekly
- Follow up in 4 weeks
- Consider dose increase if weight loss plateaus
- Continue lifestyle modifications`,
      internalNote: `Patient very motivated and compliant. Good candidate for continued therapy. Monitor for potential dose escalation at next visit if needed.`
    }
  }
}

export const SavingState: Story = {
  args: {
    visit: sampleVisit,
    patientName: 'Sarah Johnson',
    medication: sampleMedication,
    clinicalNote: sampleClinicalNote,
    isSaving: true
  }
}