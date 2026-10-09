from pathlib import Path
from typing import Any

from PIL import Image

IMG_SIZE = (224, 224)


def prepare_image(image_path: Path) -> Any:
    """Match the notebook contract currently declared by both training stubs."""
    image = Image.open(image_path).convert('RGB').resize(IMG_SIZE)
    # The notebooks do not yet declare normalization, so this remains model-specific.
    return image
