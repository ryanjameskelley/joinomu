// Service classes and instances
export { PatientsService, patientsService } from './patients-service.js'
export { AdminsService, adminsService } from './admins-service.js'
export { HealthMetricsService, healthMetricsService } from './health-metrics-service.js'
export { ProvidersService } from './providers-service.js'
export { ClinicalNotesService } from './clinical-notes-service.js'
export { AddendumService } from './addendum-service.js'
export { WearableDevicesService, wearableDevicesService } from './wearable-devices-service.js'
export { HealthGoalsService, healthGoalsService } from './health-goals-service.js'
export { HealthPermissionsService, healthPermissionsService } from './health-permissions-service.js'

// API utilities and helpers
export { ApiUtils, Logger, RateLimiter } from './api-utils.js'

// Type exports for service interfaces
export type {
  EligibilityFormData,
  PatientProfile,
  EligibilityResult
} from './patients-service.js'

export type {
  AdminProfile,
  PatientOverview,
  AdminDashboardStats
} from './admins-service.js'

export type {
  HealthMetricData,
  HealthMetricQuery,
  MetricSummary,
  HealthDashboard
} from './health-metrics-service.js'

export type {
  Provider,
  CreateProviderData,
  UpdateProviderData
} from './providers-service.js'

export type {
  ClinicalNote,
  CreateClinicalNoteData,
  UpdateClinicalNoteData,
  VisitInteraction,
  CreateVisitInteractionData
} from './clinical-notes-service.js'

export type {
  VisitAddendum,
  CreateAddendumData
} from './addendum-service.js'

export type {
  DeviceConnectionStatus,
  DeviceSyncResult
} from './wearable-devices-service.js'

export type {
  GoalProgress,
  GoalInsight
} from './health-goals-service.js'

export type {
  PermissionSummary,
  AccessAuditLog
} from './health-permissions-service.js'

export type {
  ApiResponse,
  PaginationOptions,
  PaginatedResponse
} from './api-utils.js'