import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function PublicMap() {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const fetchMarkers = async () => {
      const snapshot = await getDocs(collection(db, 'publicPosts'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarkers(data);
    };

    fetchMarkers();
  }, []);

  return (
    <MapContainer
      center={[48.7, -53.5]}
      zoom={8}
      minZoom={8}
      maxZoom={12}
      scrollWheelZoom={true}
      className="h-screen w-full z-0"
      maxBounds={[
        [46.5, -59.5],  // SW corner of NL
        [51.2, -52.2],  // NE corner of NL
      ]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup>
            <strong>{marker.location}</strong>
            <br />
            {marker.description}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
