import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { db, storage } from '../lib/firebase';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Navbar from './Navbar';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)', // Leaves space for sticky navbar
};

const nlBounds = {
  north: 51.2,
  south: 46.5,
  west: -59.5,
  east: -52.2,
};

const centerNL = { lat: 47.5615, lng: -52.7126 };

const markerIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ targetLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetLocation) return;
    const zoom = targetLocation.zoom ?? 10;
    map.setView([targetLocation.lat, targetLocation.lng], zoom, { animate: true });
  }, [map, targetLocation]);

  return null;
}

function MapClickHandler({ enabled, onSelect }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function formatReviewDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return new Date(value).toLocaleDateString();
  if (value.toDate) return value.toDate().toLocaleDateString();
  return '';
}

function MarkerPopupContent({ marker, onAddReview }) {
  const [reviewText, setReviewText] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reviewText.trim()) return;
    setIsSaving(true);
    await onAddReview(marker.id, {
      text: reviewText.trim(),
      name: reviewName.trim() || 'Anonymous',
    });
    setReviewText('');
    setReviewName('');
    setIsSaving(false);
  };

  return (
    <div className="w-64 space-y-3">
      <div>
        <h2 className="text-base font-semibold">{marker.title || 'Untitled Spot'}</h2>
        {marker.description && (
          <p className="text-sm text-gray-600">{marker.description}</p>
        )}
      </div>

      {Array.isArray(marker.photoUrls) && marker.photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {marker.photoUrls.map((url, index) => (
            <img
              key={`${marker.id}-photo-${index}`}
              src={url}
              alt={`${marker.title || 'Location'} photo ${index + 1}`}
              className="h-20 w-full rounded object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">Reviews</h3>
        {marker.reviews?.length ? (
          <div className="space-y-2 text-xs text-gray-700">
            {marker.reviews.map((review, index) => (
              <div key={`${marker.id}-review-${index}`} className="rounded bg-gray-50 p-2">
                <p className="font-semibold">{review.name || 'Anonymous'}</p>
                <p>{review.text}</p>
                {review.createdAt && (
                  <p className="text-[10px] text-gray-500">{formatReviewDate(review.createdAt)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No reviews yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Your name (optional)"
          className="w-full rounded border px-2 py-1 text-xs"
          value={reviewName}
          onChange={(event) => setReviewName(event.target.value)}
        />
        <textarea
          rows="2"
          placeholder="Add a review"
          className="w-full rounded border px-2 py-1 text-xs"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
        />
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
}

export default function PublicMap() {
  const [markers, setMarkers] = useState([]);
  const [targetLocation, setTargetLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [draftLocation, setDraftLocation] = useState(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftReviewer, setDraftReviewer] = useState('');
  const [draftReviewText, setDraftReviewText] = useState('');
  const [draftPhotos, setDraftPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);

  useEffect(() => {
    const fetchMarkers = async () => {
      const snapshot = await getDocs(collection(db, 'publicPosts'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkers(data);
    };
    fetchMarkers();
  }, []);

  const bounds = useMemo(
    () => [
      [nlBounds.south, nlBounds.west],
      [nlBounds.north, nlBounds.east],
    ],
    []
  );

  const handlePlaceSelected = ({ lat, lng }) => {
    setTargetLocation({ lat, lng, zoom: 16 });
    if (isPlacingMarker) {
      setDraftLocation({ lat, lng });
      setDraftLabel('Search result');
      setIsPlacingMarker(false);
    }
  };

  const handleMapSelect = ({ lat, lng }) => {
    setDraftLocation({ lat, lng });
    setDraftLabel('');
    setIsPlacingMarker(false);
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    setDraftPhotos(files);
  };

  const uploadPhotos = async (files, markerId) => {
    if (!files.length) return [];
    const uploads = files.map(async (file, index) => {
      const fileRef = ref(storage, `publicPosts/${markerId}/${Date.now()}-${index}-${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    });
    return Promise.all(uploads);
  };

  const handleAddMarker = async (event) => {
    event.preventDefault();
    if (!draftLocation || !draftTitle.trim()) return;

    setIsSaving(true);
    try {
      const newMarker = {
        title: draftTitle.trim(),
        description: draftDescription.trim(),
        lat: draftLocation.lat,
        lng: draftLocation.lng,
        createdAt: serverTimestamp(),
        photoUrls: [],
        reviews: [],
      };

      if (draftReviewText.trim()) {
        newMarker.reviews.push({
          text: draftReviewText.trim(),
          name: draftReviewer.trim() || 'Anonymous',
          createdAt: new Date().toISOString(),
        });
      }

      const docRef = await addDoc(collection(db, 'publicPosts'), newMarker);
      const photoUrls = await uploadPhotos(draftPhotos, docRef.id);

      if (photoUrls.length) {
        await updateDoc(doc(db, 'publicPosts', docRef.id), {
          photoUrls,
        });
      }

      setMarkers((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newMarker,
          photoUrls,
        },
      ]);

      setDraftLocation(null);
      setDraftLabel('');
      setDraftTitle('');
      setDraftDescription('');
      setDraftReviewer('');
      setDraftReviewText('');
      setDraftPhotos([]);
      setIsPlacingMarker(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReview = async (markerId, review) => {
    await updateDoc(doc(db, 'publicPosts', markerId), {
      reviews: arrayUnion({
        ...review,
        createdAt: serverTimestamp(),
      }),
    });

    setMarkers((prev) =>
      prev.map((marker) => {
        if (marker.id !== markerId) return marker;
        const existingReviews = marker.reviews || [];
        return {
          ...marker,
          reviews: [
            ...existingReviews,
            { ...review, createdAt: new Date().toISOString() },
          ],
        };
      })
    );
  };

  const handleResetView = () => {
    if (mapInstance) {
      mapInstance.setView([centerNL.lat, centerNL.lng], 11, { animate: true });
    }
    setTargetLocation({ ...centerNL, zoom: 11 });
  };

  useEffect(() => {
    if (!mapInstance) return;
    const markerCursor = `url(${markerIcon.options.iconUrl}) 12 41, crosshair`;
    mapInstance.getContainer().style.cursor = isPlacingMarker ? markerCursor : '';
  }, [isPlacingMarker, mapInstance]);

  return (
    <>
      <Navbar onPlaceSelected={handlePlaceSelected} />
      <div className="relative">
        <MapContainer
          style={containerStyle}
          center={centerNL}
          zoom={11}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          zoomControl
          scrollWheelZoom
          whenCreated={setMapInstance}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController targetLocation={targetLocation} />
          <MapClickHandler enabled={isPlacingMarker} onSelect={handleMapSelect} />
          <MarkerClusterGroup>
            {markers.map(marker => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={markerIcon}
              >
                <Popup>
                  <MarkerPopupContent marker={marker} onAddReview={handleAddReview} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        <button
          type="button"
          onClick={handleResetView}
          className="absolute bottom-6 right-6 z-[1000] rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
        >
          Back to St. John's
        </button>

        <button
          type="button"
          onClick={() => setIsPlacingMarker((prev) => !prev)}
          className="absolute bottom-20 right-6 z-[1000] rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
        >
          {isPlacingMarker ? 'Click map to drop marker' : 'Place a marker'}
        </button>

        {draftLocation && (
          <div className="absolute right-6 top-6 z-[1000] w-80 rounded-lg bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold">Add a marker</h2>
            <p className="text-xs text-gray-500">
              {draftLabel || `Lat ${draftLocation.lat.toFixed(4)}, Lng ${draftLocation.lng.toFixed(4)}`}
            </p>

            <form onSubmit={handleAddMarker} className="mt-3 space-y-3">
              <input
                type="text"
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Location name"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                required
              />
              <textarea
                rows="2"
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Notes about this place"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
              />
              <input
                type="text"
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Your name (optional)"
                value={draftReviewer}
                onChange={(event) => setDraftReviewer(event.target.value)}
              />
              <textarea
                rows="2"
                className="w-full rounded border px-2 py-1 text-sm"
                placeholder="Add a review (optional)"
                value={draftReviewText}
                onChange={(event) => setDraftReviewText(event.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full text-xs"
                onChange={handlePhotoChange}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Marker'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded border px-3 py-2 text-sm"
                  onClick={() => setDraftLocation(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
