from pathlib import Path


def prepare_image(image_path: Path) -> Path:
    """Validate the image path; add resize/normalization before model inference."""
    if not image_path.is_file():
        raise FileNotFoundError(image_path)
    return image_path
