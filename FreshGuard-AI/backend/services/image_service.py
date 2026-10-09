from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from core.config import settings

ALLOWED_FORMATS = {'JPEG': '.jpg', 'PNG': '.png', 'WEBP': '.webp'}


def validate_and_save(contents: bytes, upload_dir: Path) -> Path:
    if len(contents) > settings.max_upload_size_mb * 1024 * 1024:
        raise ValueError(f'Maximum file size is {settings.max_upload_size_mb} MB')
    try:
        image = Image.open(BytesIO(contents))
        image.verify()
        image = Image.open(BytesIO(contents))
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError('Please upload a valid JPG, PNG or WEBP image') from exc
    suffix = ALLOWED_FORMATS.get(image.format)
    if suffix is None:
        raise ValueError('Only JPG, PNG and WEBP images are supported')
    upload_dir.mkdir(parents=True, exist_ok=True)
    path = upload_dir / f'inspection_{uuid4().hex}{suffix}'
    path.write_bytes(contents)
    return path
