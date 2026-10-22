import os
import uuid
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

try:
    import imagehash
except ImportError:
    imagehash = None

from ..config import settings
from ..utils.geo import find_closest_taluka, is_point_in_goa

def extract_exif_gps(image_path: Path) -> Tuple[Optional[float], Optional[float]]:
    """Extracts latitude and longitude from JPEG EXIF metadata if present."""
    try:
        with Image.open(image_path) as img:
            exif_data = img._getexif()
            if not exif_data:
                return None, None
            
            gps_info = {}
            for tag, value in exif_data.items():
                decoded = TAGS.get(tag, tag)
                if decoded == "GPSInfo":
                    for t in value:
                        sub_decoded = GPSTAGS.get(t, t)
                        gps_info[sub_decoded] = value[t]
            
            if not gps_info or "GPSLatitude" not in gps_info or "GPSLongitude" not in gps_info:
                return None, None
                
            def convert_to_degrees(value):
                d = float(value[0])
                m = float(value[1])
                s = float(value[2])
                return d + (m / 60.0) + (s / 3600.0)

            lat = convert_to_degrees(gps_info["GPSLatitude"])
            if gps_info.get("GPSLatitudeRef") != "N":
                lat = -lat

            lon = convert_to_degrees(gps_info["GPSLongitude"])
            if gps_info.get("GPSLongitudeRef") != "E":
                lon = -lon

            return round(lat, 6), round(lon, 6)
    except Exception:
        return None, None

def compute_image_phash(image_path: Path) -> Optional[str]:
    """Computes perceptual hash for visual deduplication."""
    if imagehash is None:
        return None
    try:
        with Image.open(image_path) as img:
            return str(imagehash.phash(img))
    except Exception:
        return None

def generate_tracking_number() -> str:
    """Generates a human-readable emergency CAD tracking code: e.g. PASHU-26-8921."""
    short_uuid = uuid.uuid4().hex[:4].upper()
    year_suffix = datetime.utcnow().strftime("%y")
    random_digits = int(time.time() * 1000) % 9000 + 1000
    return f"PASHU-{year_suffix}-{random_digits}"

class CitizenIntakeEngine:
    @staticmethod
    def process_submission(
        citizen_phone: str,
        citizen_name: Optional[str],
        latitude: Optional[float],
        longitude: Optional[float],
        address_text: Optional[str],
        landmark: Optional[str],
        reported_species: str,
        image_bytes: Optional[bytes] = None,
        image_filename: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        audio_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Ingests, validates coordinates, saves media, extracts EXIF telemetry,
        and prepares the incident for AI triage.
        """
        tracking_num = generate_tracking_number()
        saved_image_path = None
        saved_audio_path = None
        phash_str = None
        
        # 1. Process and save image
        if image_bytes and image_filename:
            ext = Path(image_filename).suffix.lower() or ".jpg"
            safe_img_name = f"{tracking_num}_img{ext}"
            img_dest = settings.UPLOAD_DIR / safe_img_name
            with open(img_dest, "wb") as f:
                f.write(image_bytes)
            saved_image_path = str(img_dest)
            
            # Compute pHash for duplicate detection
            phash_str = compute_image_phash(img_dest)
            
            # Check EXIF GPS if user didn't provide location
            if latitude is None or longitude is None:
                exif_lat, exif_lon = extract_exif_gps(img_dest)
                if exif_lat is not None and exif_lon is not None:
                    latitude = exif_lat
                    longitude = exif_lon

        # 2. Process and save audio
        if audio_bytes and audio_filename:
            ext = Path(audio_filename).suffix.lower() or ".wav"
            safe_aud_name = f"{tracking_num}_voice{ext}"
            aud_dest = settings.UPLOAD_DIR / safe_aud_name
            with open(aud_dest, "wb") as f:
                f.write(audio_bytes)
            saved_audio_path = str(aud_dest)

        # 3. Fallback coordinates if outside or unprovided (Default to Panaji City Center)
        if latitude is None or longitude is None or not is_point_in_goa(latitude, longitude):
            # Default to Dayanand Bandodkar Marg, Panaji, Goa
            latitude = 15.4989
            longitude = 73.8278
            
        taluka = find_closest_taluka(latitude, longitude)

        return {
            "tracking_number": tracking_num,
            "citizen_phone": citizen_phone,
            "citizen_name": citizen_name or "Goa Citizen",
            "latitude": latitude,
            "longitude": longitude,
            "taluka": taluka,
            "address_text": address_text or f"Near {landmark or 'Main Road'}, {taluka}, Goa",
            "landmark": landmark,
            "reported_species": reported_species,
            "image_path": saved_image_path,
            "audio_path": saved_audio_path,
            "phash": phash_str
        }

    @staticmethod
    def parse_whatsapp_webhook(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parses WhatsApp Cloud API JSON webhook message payload."""
        try:
            entry = payload.get("entry", [])[0]
            changes = entry.get("changes", [])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])
            if not messages:
                return None
            msg = messages[0]
            phone = msg.get("from", "")
            msg_type = msg.get("type", "")
            
            parsed = {
                "citizen_phone": phone,
                "timestamp": msg.get("timestamp", ""),
                "msg_type": msg_type,
                "text": msg.get("text", {}).get("body", "") if msg_type == "text" else "",
                "location": msg.get("location", None),
                "media_id": msg.get("image", {}).get("id") or msg.get("voice", {}).get("id") or ""
            }
            return parsed
        except Exception:
            return None
