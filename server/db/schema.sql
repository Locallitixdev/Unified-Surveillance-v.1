-- ═══════════════════════════════════════════════════════
-- SENTINEL Database Schema
-- ═══════════════════════════════════════════════════════

-- ─── CAMERAS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cameras (
    id          VARCHAR(20) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    industry    VARCHAR(30),
    zone        VARCHAR(80),
    type        VARCHAR(20),
    protocol    VARCHAR(10),
    resolution  VARCHAR(20),
    status      VARCHAR(20) DEFAULT 'online',
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    ip          VARCHAR(45),
    port        INTEGER,
    stream_url  TEXT,
    fps         INTEGER DEFAULT 30,
    recording   BOOLEAN DEFAULT TRUE,
    night_vision BOOLEAN DEFAULT FALSE,
    last_detection TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DRONES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drones (
    id              VARCHAR(20) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    model           VARCHAR(80),
    industry        VARCHAR(30),
    assigned_zone   VARCHAR(80),
    status          VARCHAR(20) DEFAULT 'docked',
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    altitude        INTEGER DEFAULT 0,
    battery         INTEGER DEFAULT 100,
    speed           REAL DEFAULT 0,
    flight_time     INTEGER DEFAULT 0,
    stream_url      TEXT,
    patrol_route    JSONB,
    last_mission    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SENSORS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensors (
    id          VARCHAR(20) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(30),
    industry    VARCHAR(30),
    zone        VARCHAR(80),
    status      VARCHAR(20) DEFAULT 'active',
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    value       REAL,
    unit        VARCHAR(20),
    threshold   REAL,
    battery     INTEGER DEFAULT 100,
    protocol    VARCHAR(20),
    last_reading TIMESTAMPTZ,
    history     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id          VARCHAR(20) PRIMARY KEY,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source      VARCHAR(20),
    source_id   VARCHAR(20),
    type        VARCHAR(40),
    severity    VARCHAR(20),
    description TEXT,
    industry    VARCHAR(30),
    zone        VARCHAR(80),
    acknowledged BOOLEAN DEFAULT FALSE,
    metadata    JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);

-- ─── ALERTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id              VARCHAR(20) PRIMARY KEY,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rule_id         VARCHAR(20),
    severity        VARCHAR(20),
    title           VARCHAR(200),
    description     TEXT,
    sources         JSONB,
    industry        VARCHAR(30),
    zone            VARCHAR(80),
    status          VARCHAR(20) DEFAULT 'active',
    assigned_to     VARCHAR(50),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- ─── RULES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rules (
    id          VARCHAR(20) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    conditions  JSONB,
    actions     TEXT[],
    severity    VARCHAR(20),
    enabled     BOOLEAN DEFAULT TRUE,
    industry    VARCHAR(30)
);

-- ─── USERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(20) PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    full_name   VARCHAR(100),
    email       VARCHAR(150) UNIQUE,
    role        VARCHAR(20) DEFAULT 'viewer',
    status      VARCHAR(20) DEFAULT 'active',
    avatar      TEXT,
    last_login  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANALYTICS (materialized for fast reads) ─────────
CREATE TABLE IF NOT EXISTS analytics_hourly (
    hour        VARCHAR(5) PRIMARY KEY,
    detections  INTEGER DEFAULT 0,
    alerts      INTEGER DEFAULT 0,
    incidents   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_daily (
    date                VARCHAR(10) PRIMARY KEY,
    label               VARCHAR(10),
    total_detections    INTEGER DEFAULT 0,
    total_alerts        INTEGER DEFAULT 0,
    avg_response_time   REAL DEFAULT 0,
    critical_incidents  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_by_type (
    type    VARCHAR(40) PRIMARY KEY,
    count   INTEGER DEFAULT 0,
    color   VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS analytics_by_severity (
    severity VARCHAR(20) PRIMARY KEY,
    count    INTEGER DEFAULT 0,
    color    VARCHAR(10)
);
