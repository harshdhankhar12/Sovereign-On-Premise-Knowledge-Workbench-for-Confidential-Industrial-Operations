CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    plant_unit VARCHAR(100),
    department VARCHAR(100),
    confidentiality_level VARCHAR(50) DEFAULT 'RESTRICTED',
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_hash_sha256 CHAR(64) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSING',
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    page_number INTEGER,
    sheet_name VARCHAR(100),
    bounding_box JSONB,
    token_count INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS equipment_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL UNIQUE,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    plant_unit VARCHAR(100) NOT NULL,
    design_specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS chunk_tag_mapping (
    chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES equipment_tags(id) ON DELETE CASCADE,
    confidence FLOAT DEFAULT 1.0,
    PRIMARY KEY (chunk_id, tag_id)
);

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    intent VARCHAR(100),
    prompt TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    model_used VARCHAR(100) DEFAULT 'llama3.1:8b',
    final_response TEXT,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS task_steps (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    node_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(50) NOT NULL,
    step_message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS calculation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    formula_name VARCHAR(100) NOT NULL,
    python_code TEXT NOT NULL,
    input_params JSONB NOT NULL,
    calculated_output JSONB,
    claimed_value DOUBLE PRECISION,
    discrepancy_pct DOUBLE PRECISION,
    verification_passed BOOLEAN DEFAULT FALSE,
    execution_time_ms INTEGER NOT NULL,
    sandbox_status VARCHAR(50) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    draft_content TEXT NOT NULL,
    engineer_edits TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    reviewer_id VARCHAR(100),
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    user_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    prompt_hash CHAR(64) NOT NULL,
    response_hash CHAR(64),
    network_egress_bytes INTEGER DEFAULT 0,
    details JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS processing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    total_duration_seconds DOUBLE PRECISION NOT NULL,
    manual_baseline_minutes DOUBLE PRECISION DEFAULT 45.0,
    time_saved_minutes DOUBLE PRECISION GENERATED ALWAYS AS (manual_baseline_minutes - (total_duration_seconds / 60.0)) STORED,
    plant_unit VARCHAR(100),
    recorded_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_hash ON document_versions(file_hash_sha256);
CREATE INDEX IF NOT EXISTS idx_document_versions_metadata ON document_versions USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_document_chunks_version_id ON document_chunks(version_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts ON document_chunks USING gin (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_equipment_tags_unit ON equipment_tags(plant_unit);
CREATE INDEX IF NOT EXISTS idx_equipment_tags_type ON equipment_tags(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_tags_specs ON equipment_tags USING gin (design_specs);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_created_at ON task_steps(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_calculation_runs_task_id ON calculation_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_calculation_runs_formula ON calculation_runs(formula_name);

CREATE INDEX IF NOT EXISTS idx_approval_requests_task_id ON approval_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING gin (details);

CREATE INDEX IF NOT EXISTS idx_processing_metrics_task_id ON processing_metrics(task_id);
CREATE INDEX IF NOT EXISTS idx_processing_metrics_unit ON processing_metrics(plant_unit);
