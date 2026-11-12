from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from server.core.config import settings

SECRET_KEY = getattr(settings, "SECRET_KEY", "sovereign_industrial_secret_key_mrpl_2026")
ALGORITHM = "HS256"

ROLE_OPERATOR = "OPERATOR"
ROLE_PROCESS_ENGINEER = "PROCESS_ENGINEER"
ROLE_PLANT_MANAGER = "PLANT_MANAGER"
ROLE_SAFETY_AUDITOR = "SAFETY_AUDITOR"

VALID_ROLES = [
    ROLE_OPERATOR,
    ROLE_PROCESS_ENGINEER,
    ROLE_PLANT_MANAGER,
    ROLE_SAFETY_AUDITOR,
]

CLEARANCE_PUBLIC = "PUBLIC"
CLEARANCE_INTERNAL = "INTERNAL"
CLEARANCE_RESTRICTED = "RESTRICTED"
CLEARANCE_SECRET = "SECRET"

ROLE_CLEARANCE: Dict[str, List[str]] = {
    ROLE_OPERATOR: [CLEARANCE_PUBLIC, CLEARANCE_INTERNAL],
    ROLE_PROCESS_ENGINEER: [CLEARANCE_PUBLIC, CLEARANCE_INTERNAL, CLEARANCE_RESTRICTED],
    ROLE_PLANT_MANAGER: [CLEARANCE_PUBLIC, CLEARANCE_INTERNAL, CLEARANCE_RESTRICTED, CLEARANCE_SECRET],
    ROLE_SAFETY_AUDITOR: [CLEARANCE_PUBLIC, CLEARANCE_INTERNAL, CLEARANCE_RESTRICTED, CLEARANCE_SECRET],
}

security_bearer = HTTPBearer(auto_error=False)

def get_allowed_clearances(role: str) -> List[str]:
    return ROLE_CLEARANCE.get(role.upper(), [CLEARANCE_PUBLIC])

def is_clearance_sufficient(role: str, document_clearance: str) -> bool:
    allowed = get_allowed_clearances(role)
    return document_clearance.upper() in allowed

def create_access_token(user_id: str, role: str, expires_minutes: int = 1440) -> str:
    norm_role = role.upper()
    if norm_role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of {VALID_ROLES}")

    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)

    payload = {
        "sub": user_id,
        "role": norm_role,
        "clearances": get_allowed_clearances(norm_role),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> Dict[str, Any]:
    if not credentials:
        return {
            "user_id": "anonymous_engineer",
            "role": ROLE_OPERATOR,
            "clearances": get_allowed_clearances(ROLE_OPERATOR),
        }

    token = credentials.credentials
    payload = decode_access_token(token)
    return {
        "user_id": payload.get("sub", "unknown_user"),
        "role": payload.get("role", ROLE_OPERATOR),
        "clearances": payload.get("clearances", get_allowed_clearances(ROLE_OPERATOR)),
    }

def require_role(allowed_roles: List[str]):
    async def role_checker(
        current_user: Dict[str, Any] = Security(get_current_user),
    ) -> Dict[str, Any]:
        user_role = current_user.get("role", ROLE_OPERATOR)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {allowed_roles}. Current role: {user_role}",
            )
        return current_user
    return role_checker
