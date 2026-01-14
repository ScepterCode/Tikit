"""
Event-related Pydantic models for request/response schemas
"""
from pydantic import BaseModel, validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from decimal import Decimal

# Event Tier Models
class EventTierBase(BaseModel):
    name: str
    price: float
    quantity: int
    description: Optional[str] = None
    benefits: Optional[List[str]] = None

class EventTierCreate(EventTierBase):
    id: str

class EventTierResponse(EventTierBase):
    id: str
    sold: int = 0
    available: int

# Event Models
class EventBase(BaseModel):
    title: str
    description: str
    event_type: Literal["wedding", "crusade", "burial", "festival", "general"]
    start_date: datetime
    end_date: datetime
    venue: str
    state: str
    lga: str
    latitude: float
    longitude: float
    capacity: int
    
    @validator('latitude')
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @validator('longitude')
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class EventCreate(EventBase):
    tiers: List[EventTierCreate]
    cultural_features: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    is_hidden: bool = False
    access_code: Optional[str] = None

class HiddenEventCreate(EventCreate):
    is_hidden: bool = True
    access_code: str
    
    @validator('access_code')
    def validate_access_code(cls, v):
        if not v or len(v) != 4 or not v.isdigit():
            raise ValueError('Access code must be exactly 4 digits')
        return v

class WeddingEventCreate(EventCreate):
    event_type: Literal["wedding"] = "wedding"
    bride_name: str
    groom_name: str
    wedding_date: datetime
    reception_venue: Optional[str] = None
    dress_code: Optional[str] = None
    gift_registry: Optional[List[str]] = None

class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    event_type: str
    start_date: datetime
    end_date: datetime
    venue: str
    state: str
    lga: str
    latitude: float
    longitude: float
    capacity: int
    sold_tickets: int = 0
    available_tickets: int
    status: str
    is_hidden: bool
    organizer_id: str
    organizer_name: str
    tiers: List[EventTierResponse]
    images: Optional[List[str]] = None
    cultural_features: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# Event Filters
class EventFilters(BaseModel):
    page: int = 1
    limit: int = 20
    event_type: Optional[Literal["wedding", "crusade", "burial", "festival", "general"]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    lga: Optional[str] = None
    distance: Optional[int] = None
    language: Optional[Literal["en", "ha", "ig", "yo", "pcm"]] = None
    capacity_status: Optional[Literal["available", "almost_full", "sold_out"]] = None
    organizer_type: Optional[str] = None
    payment_methods: Optional[List[str]] = None
    accessibility_features: Optional[List[str]] = None
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Page must be at least 1')
        return v
    
    @validator('limit')
    def validate_limit(cls, v):
        if not 1 <= v <= 100:
            raise ValueError('Limit must be between 1 and 100')
        return v
    
    @validator('distance')
    def validate_distance(cls, v):
        if v is not None and not 1 <= v <= 500:
            raise ValueError('Distance must be between 1 and 500 km')
        return v

# Access Code Validation
class AccessCodeRequest(BaseModel):
    access_code: str
    
    @validator('access_code')
    def validate_access_code(cls, v):
        if not v or len(v) != 4 or not v.isdigit():
            raise ValueError('Access code must be exactly 4 digits')
        return v

# Invitation Tracking
class InvitationTrackRequest(BaseModel):
    event_id: str
    source: str

class ShareableLinkRequest(BaseModel):
    event_id: str
    source: Literal["whatsapp", "sms", "email", "other"]

# Spray Money (Wedding Feature)
class SprayMoneyTransaction(BaseModel):
    event_id: str
    amount: float
    sprayer_name: str
    recipient: Literal["bride", "groom", "couple"]
    message: Optional[str] = None

class SprayMoneyLeaderboard(BaseModel):
    event_id: str
    top_sprayers: List[Dict[str, Any]]
    total_amount: float
    transaction_count: int

# Event Feed Response
class EventFeedResponse(BaseModel):
    events: List[EventResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool