import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from server.models.audit import AuditLog

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_record_hash(
    record_id: int,
    user_id: str,
    user_role: str,
    event_type: str,
    resource_id: str,
    details: Dict[str, Any],
    timestamp_iso: str,
    previous_hash: str,
) -> str:
    canon_details = json.dumps(details or {}, sort_keys=True, separators=(",", ":"))
    raw_payload = f"{record_id}|{user_id}|{user_role}|{event_type}|{resource_id or ''}|{canon_details}|{timestamp_iso}|{previous_hash}"
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

class AuditLedgerService:
    async def record_event(
        self,
        session: AsyncSession,
        user_id: str,
        user_role: str,
        event_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        task_id: Optional[UUID] = None,
    ) -> AuditLog:
        stmt_latest = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
        latest = (await session.execute(stmt_latest)).scalar_one_or_none()

        prev_hash = latest.current_hash if latest and latest.current_hash else GENESIS_HASH
        now_dt = datetime.now(timezone.utc).replace(microsecond=0)

        record = AuditLog(
            task_id=task_id,
            user_id=user_id,
            user_role=user_role,
            event_type=event_type,
            resource_id=resource_id,
            details=details or {},
            previous_hash=prev_hash,
            current_hash="PENDING",
            network_egress_bytes=0,
            timestamp=now_dt,
        )
        session.add(record)
        await session.flush()

        ts_str = record.timestamp.replace(microsecond=0).isoformat()
        curr_hash = compute_record_hash(
            record_id=record.id,
            user_id=user_id,
            user_role=user_role,
            event_type=event_type,
            resource_id=resource_id or "",
            details=details or {},
            timestamp_iso=ts_str,
            previous_hash=prev_hash,
        )
        record.current_hash = curr_hash
        await session.commit()
        await session.refresh(record)
        return record

    async def verify_chain_integrity(self, session: AsyncSession) -> Dict[str, Any]:
        stmt = select(AuditLog).order_by(AuditLog.id.asc())
        records = (await session.execute(stmt)).scalars().all()

        if not records:
            return {
                "integrity_valid": True,
                "total_records_verified": 0,
                "genesis_hash": None,
                "latest_hash": None,
                "tampered_record_id": None,
                "tampered_at_sequence": None,
                "message": "Audit ledger is empty.",
            }

        for idx, r in enumerate(records):
            expected_prev = GENESIS_HASH if idx == 0 else records[idx - 1].current_hash
            if r.previous_hash != expected_prev:
                return {
                    "integrity_valid": False,
                    "total_records_verified": idx,
                    "genesis_hash": records[0].current_hash,
                    "latest_hash": records[-1].current_hash,
                    "tampered_record_id": r.id,
                    "tampered_at_sequence": idx + 1,
                    "message": f"Previous hash broken at record ID {r.id} (sequence {idx + 1}).",
                }

            ts_str = r.timestamp.replace(microsecond=0).isoformat()
            expected_cur = compute_record_hash(
                record_id=r.id,
                user_id=r.user_id,
                user_role=r.user_role,
                event_type=r.event_type,
                resource_id=r.resource_id or "",
                details=r.details or {},
                timestamp_iso=ts_str,
                previous_hash=r.previous_hash,
            )
            if r.current_hash != expected_cur:
                return {
                    "integrity_valid": False,
                    "total_records_verified": idx,
                    "genesis_hash": records[0].current_hash,
                    "latest_hash": records[-1].current_hash,
                    "tampered_record_id": r.id,
                    "tampered_at_sequence": idx + 1,
                    "message": f"Content tampering detected at record ID {r.id} (sequence {idx + 1}).",
                }

        return {
            "integrity_valid": True,
            "total_records_verified": len(records),
            "genesis_hash": records[0].current_hash,
            "latest_hash": records[-1].current_hash,
            "tampered_record_id": None,
            "tampered_at_sequence": None,
            "message": "Cryptographic audit chain is 100% verified and tamper-free.",
        }

audit_service = AuditLedgerService()
