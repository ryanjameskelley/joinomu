-- Database Backup and Recovery Extensions for JoinOmu Healthcare Platform
-- HIPAA-compliant backup metadata and audit logging tables

-- Backup metadata tracking
CREATE TABLE IF NOT EXISTS public.backup_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT UNIQUE NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'transaction_log')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  size_bytes BIGINT,
  checksum TEXT,
  encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
  encryption_key_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  
  -- Storage locations
  primary_location TEXT,
  secondary_location TEXT,
  tertiary_location TEXT,
  
  -- Verification status
  integrity_verified BOOLEAN DEFAULT false,
  test_restore_verified BOOLEAN DEFAULT false,
  last_verification TIMESTAMPTZ,
  
  -- Compliance tracking
  hipaa_compliant BOOLEAN DEFAULT true,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  retention_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup verification logs
CREATE TABLE IF NOT EXISTS public.backup_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT NOT NULL REFERENCES public.backup_metadata(backup_id),
  verification_type TEXT NOT NULL CHECK (verification_type IN ('integrity', 'restore_test', 'performance')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  details JSONB,
  duration_ms INTEGER,
  performed_by TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disaster recovery test logs
CREATE TABLE IF NOT EXISTS public.disaster_recovery_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT UNIQUE NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('corruption', 'regional_outage', 'security_breach')),
  backup_used TEXT NOT NULL,
  
  -- Test results
  rto_target_ms INTEGER DEFAULT 14400000, -- 4 hours
  rto_actual_ms INTEGER,
  rto_met BOOLEAN,
  
  rpo_target_ms INTEGER DEFAULT 900000, -- 15 minutes
  rpo_actual_ms INTEGER,
  rpo_met BOOLEAN,
  
  data_integrity_verified BOOLEAN,
  performance_baseline_met BOOLEAN,
  
  -- Test details
  test_environment TEXT DEFAULT 'disaster_recovery_test',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  performed_by TEXT,
  approval_chain JSONB,
  
  -- Results and notes
  test_results JSONB,
  issues_found JSONB DEFAULT '[]'::jsonb,
  recommendations TEXT
);

-- Backup restoration logs
CREATE TABLE IF NOT EXISTS public.backup_restoration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restore_id TEXT UNIQUE NOT NULL,
  backup_id TEXT NOT NULL REFERENCES public.backup_metadata(backup_id),
  
  -- Restore details
  restore_type TEXT NOT NULL CHECK (restore_type IN ('full', 'point_in_time', 'partial')),
  target_database TEXT NOT NULL,
  point_in_time TIMESTAMPTZ,
  
  -- Authorization
  requested_by TEXT NOT NULL,
  approved_by JSONB, -- Array of approvers
  justification TEXT NOT NULL,
  
  -- Execution
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Results
  success BOOLEAN,
  error_message TEXT,
  data_verified BOOLEAN DEFAULT false,
  
  -- Compliance
  hipaa_notification_sent BOOLEAN DEFAULT false,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced audit logs for backup operations
CREATE TABLE IF NOT EXISTS public.backup_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('backup', 'restore', 'verification', 'cleanup', 'security')),
  
  -- Context
  backup_id TEXT,
  restore_id TEXT,
  user_id UUID,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Event details
  event_data JSONB,
  before_state JSONB,
  after_state JSONB,
  
  -- Compliance
  compliance_category TEXT DEFAULT 'data_management',
  hipaa_relevant BOOLEAN DEFAULT true,
  retention_required_until TIMESTAMPTZ,
  
  -- System info
  service_name TEXT DEFAULT 'backup_service',
  service_version TEXT,
  environment TEXT DEFAULT 'production',
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Backup encryption key management
CREATE TABLE IF NOT EXISTS public.backup_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT UNIQUE NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_version INTEGER DEFAULT 1,
  
  -- Key lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  
  -- Key management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'deactivated')),
  rotation_schedule_days INTEGER DEFAULT 90,
  next_rotation_due TIMESTAMPTZ,
  
  -- Usage tracking
  backups_encrypted INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  
  -- Compliance
  fips_140_2_compliant BOOLEAN DEFAULT true,
  audit_trail JSONB DEFAULT '[]'::jsonb
);

-- Backup storage quotas and monitoring
CREATE TABLE IF NOT EXISTS public.backup_storage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_location TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'supabase', 'aws_s3', 'azure_blob'
  
  -- Storage metrics
  total_capacity_bytes BIGINT,
  used_capacity_bytes BIGINT,
  available_capacity_bytes BIGINT,
  utilization_percent DECIMAL(5,2),
  
  -- Performance metrics
  read_throughput_mbps DECIMAL(10,2),
  write_throughput_mbps DECIMAL(10,2),
  latency_ms INTEGER,
  
  -- Cost tracking
  monthly_cost_usd DECIMAL(10,2),
  cost_per_gb_usd DECIMAL(10,4),
  
  -- Health status
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical', 'offline')),
  last_health_check TIMESTAMPTZ DEFAULT NOW(),
  
  -- Alerting thresholds
  alert_threshold_percent INTEGER DEFAULT 80,
  critical_threshold_percent INTEGER DEFAULT 95,
  
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all backup tables
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_recovery_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restoration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_storage_metrics ENABLE ROW LEVEL SECURITY;

-- Backup metadata access policies
CREATE POLICY "backup_metadata_admin_access" ON public.backup_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.administrators 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "backup_metadata_dba_access" ON public.backup_metadata
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'database_administrator'
    )
  );

-- Verification logs access
CREATE POLICY "verification_logs_dba_access" ON public.backup_verification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('database_administrator', 'system_administrator')
    )
  );

-- DR test logs access (read-only for compliance officers)
CREATE POLICY "dr_tests_compliance_read" ON public.disaster_recovery_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('compliance_officer', 'security_officer')
    )
  );

CREATE POLICY "dr_tests_admin_full" ON public.disaster_recovery_tests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.administrators 
      WHERE id = auth.uid()
    )
  );

-- Restoration logs require elevated privileges
CREATE POLICY "restoration_logs_restricted" ON public.backup_restoration_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('database_administrator', 'system_administrator')
    )
  );

-- Audit logs are append-only for most users
CREATE POLICY "audit_logs_append_only" ON public.backup_audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_logs_read_restricted" ON public.backup_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('administrator', 'compliance_officer', 'security_officer')
    )
  );

-- Encryption keys are highly restricted
CREATE POLICY "encryption_keys_dba_only" ON public.backup_encryption_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'database_administrator'
    )
  );

-- Storage metrics readable by ops team
CREATE POLICY "storage_metrics_ops_read" ON public.backup_storage_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('system_administrator', 'database_administrator', 'operations')
    )
  );

-- Functions for backup operations

-- Function to update backup metadata automatically
CREATE OR REPLACE FUNCTION update_backup_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for backup metadata updates
CREATE TRIGGER backup_metadata_update_timestamp
  BEFORE UPDATE ON public.backup_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_metadata_timestamp();

-- Function to calculate backup retention dates
CREATE OR REPLACE FUNCTION calculate_backup_retention_date(
  backup_type TEXT,
  backup_timestamp TIMESTAMPTZ
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE backup_type
    WHEN 'full' THEN
      RETURN backup_timestamp + INTERVAL '30 days';
    WHEN 'incremental' THEN
      RETURN backup_timestamp + INTERVAL '7 days';
    WHEN 'transaction_log' THEN
      RETURN backup_timestamp + INTERVAL '24 hours';
    ELSE
      RETURN backup_timestamp + INTERVAL '30 days';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check backup storage quota
CREATE OR REPLACE FUNCTION check_backup_storage_quota(
  storage_location TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  latest_metrics RECORD;
BEGIN
  SELECT * INTO latest_metrics
  FROM public.backup_storage_metrics
  WHERE storage_location = check_backup_storage_quota.storage_location
  ORDER BY measured_at DESC
  LIMIT 1;
  
  IF latest_metrics.utilization_percent > 95 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to log backup audit events
CREATE OR REPLACE FUNCTION log_backup_audit_event(
  event_type TEXT,
  event_category TEXT,
  event_data JSONB DEFAULT NULL,
  backup_id TEXT DEFAULT NULL,
  restore_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.backup_audit_logs (
    event_type,
    event_category,
    event_data,
    backup_id,
    restore_id,
    user_id,
    compliance_category,
    retention_required_until
  ) VALUES (
    event_type,
    event_category,
    event_data,
    backup_id,
    restore_id,
    auth.uid(),
    'data_management',
    NOW() + INTERVAL '7 years' -- HIPAA retention requirement
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance

-- Backup metadata indexes
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type_timestamp ON public.backup_metadata(backup_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON public.backup_metadata(status);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_retention_date ON public.backup_metadata(retention_date);

-- Verification logs indexes
CREATE INDEX IF NOT EXISTS idx_verification_logs_backup_id ON public.backup_verification_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_performed_at ON public.backup_verification_logs(performed_at DESC);

-- DR test logs indexes
CREATE INDEX IF NOT EXISTS idx_dr_tests_scenario ON public.disaster_recovery_tests(scenario);
CREATE INDEX IF NOT EXISTS idx_dr_tests_started_at ON public.disaster_recovery_tests(started_at DESC);

-- Restoration logs indexes
CREATE INDEX IF NOT EXISTS idx_restoration_logs_backup_id ON public.backup_restoration_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_restoration_logs_status ON public.backup_restoration_logs(status);
CREATE INDEX IF NOT EXISTS idx_restoration_logs_started_at ON public.backup_restoration_logs(started_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.backup_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.backup_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance ON public.backup_audit_logs(compliance_category, hipaa_relevant);

-- Storage metrics indexes
CREATE INDEX IF NOT EXISTS idx_storage_metrics_location ON public.backup_storage_metrics(storage_location, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_metrics_status ON public.backup_storage_metrics(status);

-- Comments for documentation
COMMENT ON TABLE public.backup_metadata IS 'Tracks all database backup operations with HIPAA compliance metadata';
COMMENT ON TABLE public.backup_verification_logs IS 'Logs backup integrity verification and restore testing results';
COMMENT ON TABLE public.disaster_recovery_tests IS 'Records disaster recovery testing procedures and results';
COMMENT ON TABLE public.backup_restoration_logs IS 'Audit trail for all database restoration operations';
COMMENT ON TABLE public.backup_audit_logs IS 'Comprehensive audit logging for backup operations compliance';
COMMENT ON TABLE public.backup_encryption_keys IS 'Manages encryption keys used for backup security';
COMMENT ON TABLE public.backup_storage_metrics IS 'Monitors backup storage utilization and performance';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.backup_metadata TO service_role;
GRANT SELECT, INSERT ON public.backup_verification_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.disaster_recovery_tests TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.backup_restoration_logs TO service_role;
GRANT INSERT ON public.backup_audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.backup_encryption_keys TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.backup_storage_metrics TO service_role;