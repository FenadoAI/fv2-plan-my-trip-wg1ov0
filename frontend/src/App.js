import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, MapPinIcon, CalendarIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API = `${API_BASE}/api`;

const TripPlanner = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDescription, setNewPlaceDescription] = useState('');
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchPlaces(selectedTrip.id);
    }
  }, [selectedTrip]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/trips`);
      setTrips(response.data);
      if (response.data.length > 0 && !selectedTrip) {
        setSelectedTrip(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaces = async (tripId) => {
    try {
      const response = await axios.get(`${API}/trips/${tripId}/places`);
      setPlaces(response.data);
    } catch (error) {
      console.error('Error fetching places:', error);
    }
  };

  const createTrip = async () => {
    if (!newTripName.trim()) return;

    try {
      const response = await axios.post(`${API}/trips`, { name: newTripName });
      setTrips(prev => [response.data, ...prev]);
      setSelectedTrip(response.data);
      setNewTripName('');
      setIsCreateTripOpen(false);
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const addPlace = async () => {
    if (!newPlaceName.trim() || !selectedTrip) return;

    try {
      const response = await axios.post(`${API}/trips/${selectedTrip.id}/places`, {
        name: newPlaceName,
        description: newPlaceDescription
      });
      setPlaces(prev => [...prev, response.data]);
      setNewPlaceName('');
      setNewPlaceDescription('');
      setIsAddPlaceOpen(false);
    } catch (error) {
      console.error('Error adding place:', error);
    }
  };

  const deleteTrip = async (tripId) => {
    try {
      await axios.delete(`${API}/trips/${tripId}`);
      setTrips(prev => prev.filter(trip => trip.id !== tripId));
      if (selectedTrip?.id === tripId) {
        const remainingTrips = trips.filter(trip => trip.id !== tripId);
        setSelectedTrip(remainingTrips.length > 0 ? remainingTrips[0] : null);
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const deletePlace = async (placeId) => {
    try {
      await axios.delete(`${API}/places/${placeId}`);
      setPlaces(prev => prev.filter(place => place.id !== placeId));
    } catch (error) {
      console.error('Error deleting place:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600">Loading your trips...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✈️ Trip Planner</h1>
          <p className="text-lg text-gray-600">Organize your adventures, one trip at a time</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trips Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-fit shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    My Trips
                  </CardTitle>
                  <Dialog open={isCreateTripOpen} onOpenChange={setIsCreateTripOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Trip</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="trip-name">Trip Name</Label>
                          <Input
                            id="trip-name"
                            placeholder="e.g., Summer Vacation 2024"
                            value={newTripName}
                            onChange={(e) => setNewTripName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createTrip()}
                          />
                        </div>
                        <Button onClick={createTrip} className="w-full bg-blue-600 hover:bg-blue-700">
                          Create Trip
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trips.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No trips yet</p>
                    <p className="text-sm">Create your first trip to get started!</p>
                  </div>
                ) : (
                  trips.map((trip) => (
                    <div
                      key={trip.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTrip?.id === trip.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{trip.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrip(trip.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(trip.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Places Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      {selectedTrip ? `Places in ${selectedTrip.name}` : 'Select a Trip'}
                    </CardTitle>
                    {selectedTrip && (
                      <p className="text-sm text-gray-500 mt-1">
                        Add places you want to visit during this trip
                      </p>
                    )}
                  </div>
                  {selectedTrip && (
                    <Dialog open={isAddPlaceOpen} onOpenChange={setIsAddPlaceOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Place
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Place to {selectedTrip.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="place-name">Place Name</Label>
                            <Input
                              id="place-name"
                              placeholder="e.g., Eiffel Tower, Central Park"
                              value={newPlaceName}
                              onChange={(e) => setNewPlaceName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="place-description">Description (optional)</Label>
                            <Textarea
                              id="place-description"
                              placeholder="Add notes about this place..."
                              value={newPlaceDescription}
                              onChange={(e) => setNewPlaceDescription(e.target.value)}
                            />
                          </div>
                          <Button onClick={addPlace} className="w-full bg-green-600 hover:bg-green-700">
                            Add Place
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTrip ? (
                  <div className="text-center py-12 text-gray-500">
                    <MapPinIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Trip Selected</h3>
                    <p>Select a trip from the sidebar to view and manage its places</p>
                  </div>
                ) : places.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MapPinIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Places Yet</h3>
                    <p className="mb-4">Start adding places you want to visit in {selectedTrip.name}</p>
                    <Button onClick={() => setIsAddPlaceOpen(true)} className="bg-green-600 hover:bg-green-700">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Your First Place
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {places.map((place, index) => (
                      <div key={place.id} className="p-4 border rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <h4 className="font-medium text-gray-900">{place.name}</h4>
                            </div>
                            {place.description && (
                              <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Added {new Date(place.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlace(place.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TripPlanner />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
