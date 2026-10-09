from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    payload = {'sub': subject, 'exp': datetime.now(timezone.utc) + timedelta(hours=8)}
    return jwt.encode(payload, settings.jwt_secret, algorithm='HS256')


def decode_subject(token: str) -> str:
    try:
        return str(jwt.decode(token, settings.jwt_secret, algorithms=['HS256'])['sub'])
    except (JWTError, KeyError) as exc:
        raise ValueError('Invalid or expired token') from exc
