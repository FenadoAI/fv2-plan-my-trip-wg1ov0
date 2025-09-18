from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class Trip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TripCreate(BaseModel):
    name: str

class Place(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    name: str
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlaceCreate(BaseModel):
    name: str
    description: str = ""

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Trip Management Endpoints
@api_router.post("/trips", response_model=Trip)
async def create_trip(trip_data: TripCreate):
    trip_dict = trip_data.dict()
    trip_obj = Trip(**trip_dict)
    await db.trips.insert_one(trip_obj.dict())
    return trip_obj

@api_router.get("/trips", response_model=List[Trip])
async def get_trips():
    trips = await db.trips.find().sort("created_at", -1).to_list(1000)
    return [Trip(**trip) for trip in trips]

@api_router.get("/trips/{trip_id}", response_model=Trip)
async def get_trip(trip_id: str):
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Trip not found")
    return Trip(**trip)

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    # Delete trip and all its places
    await db.places.delete_many({"trip_id": trip_id})
    result = await db.trips.delete_one({"id": trip_id})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted successfully"}

# Places Management Endpoints
@api_router.post("/trips/{trip_id}/places", response_model=Place)
async def create_place(trip_id: str, place_data: PlaceCreate):
    # Verify trip exists
    trip = await db.trips.find_one({"id": trip_id})
    if not trip:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Trip not found")

    place_dict = place_data.dict()
    place_dict["trip_id"] = trip_id
    place_obj = Place(**place_dict)
    await db.places.insert_one(place_obj.dict())
    return place_obj

@api_router.get("/trips/{trip_id}/places", response_model=List[Place])
async def get_places_for_trip(trip_id: str):
    places = await db.places.find({"trip_id": trip_id}).sort("created_at", 1).to_list(1000)
    return [Place(**place) for place in places]

@api_router.delete("/places/{place_id}")
async def delete_place(place_id: str):
    result = await db.places.delete_one({"id": place_id})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Place not found")
    return {"message": "Place deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
