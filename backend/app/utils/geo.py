import math
from typing import Tuple, Dict

# Goa State Geographical Center & Taluka Centroids (True Coordinates)
GOA_TALUKAS: Dict[str, Tuple[float, float]] = {
    "Tiswadi": (15.4989, 73.8278),        # Panaji, Old Goa, Miramar
    "Bardez": (15.5898, 73.8188),         # Mapusa, Calangute, Porvorim, Anjuna
    "Salcete": (15.2832, 73.9862),        # Margao, Colva, Benaulim
    "Mormugao": (15.3991, 73.8124),       # Vasco da Gama, Dabolim
    "Ponda": (15.4026, 74.0152),          # Ponda town, Farmagudi
    "Bicholim": (15.5947, 73.9535),       # Bicholim, Mayem
    "Pernem": (15.7176, 73.7997),         # Pernem, Mandrem, Arambol
    "Sattari": (15.5524, 74.1205),        # Valpoi
    "Quepem": (15.2167, 74.0733),         # Quepem
    "Sanguem": (15.2300, 74.1500),        # Sanguem
    "Canacona": (14.9967, 74.0533),       # Palolem, Agonda
    "Dharbandora": (15.3667, 74.1333)     # Dharbandora
}

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in meters."""
    if any(coord is None for coord in (lat1, lon1, lat2, lon2)):
        return float('inf')
    R = 6371000.0 # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return haversine_distance_meters(lat1, lon1, lat2, lon2) / 1000.0

def estimate_road_travel_time_minutes(distance_km: float, vehicle_type: str = "SMALL_ANIMAL_AMBULANCE") -> float:
    """
    Estimates road travel time considering Goa road topologies:
    - TWO_WHEELER: Agile through market traffic, average 40 km/h
    - SMALL_ANIMAL_AMBULANCE: Emergency siren priority, average 45 km/h
    - CATTLE_HYDRAULIC_TRUCK: Heavy vehicle on coastal/ghat roads, average 30 km/h
    """
    speed_map = {
        "TWO_WHEELER": 40.0,
        "SMALL_ANIMAL_AMBULANCE": 45.0,
        "CATTLE_HYDRAULIC_TRUCK": 30.0,
        "WILDLIFE_RESCUE_VAN": 38.0
    }
    speed = speed_map.get(vehicle_type, 40.0)
    # Factor in 2 minutes dispatch turnout latency
    travel_time_hours = distance_km / speed
    return round((travel_time_hours * 60.0) + 2.0, 1)

def is_point_in_goa(lat: float, lon: float) -> bool:
    """Verifies whether coordinates lie within Goa state operational bounds."""
    return 14.85 <= lat <= 15.85 and 73.65 <= lon <= 74.40

def find_closest_taluka(lat: float, lon: float) -> str:
    """Finds the closest administrative taluka in Goa for given coordinates."""
    min_dist = float('inf')
    closest = "Tiswadi"
    for taluka, (t_lat, t_lon) in GOA_TALUKAS.items():
        d = haversine_distance_meters(lat, lon, t_lat, t_lon)
        if d < min_dist:
            min_dist = d
            closest = taluka
    return closest
