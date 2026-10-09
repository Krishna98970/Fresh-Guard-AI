from io import BytesIO

import pytest
from PIL import Image

from services.image_service import validate_and_save


def test_invalid_image_is_rejected(tmp_path):
    with pytest.raises(ValueError, match='valid'):
        validate_and_save(b'not an image', tmp_path)


def test_valid_image_gets_safe_generated_name(tmp_path):
    stream = BytesIO()
    Image.new('RGB', (4, 4), 'green').save(stream, format='PNG')
    path = validate_and_save(stream.getvalue(), tmp_path)
    assert path.parent == tmp_path
    assert path.name.startswith('inspection_')
    assert path.suffix == '.png'
