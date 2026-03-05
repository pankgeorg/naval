import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PortMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_eu_eea: boolean;
}

interface RouteSegment {
  points: [number, number][];
  color: string;
  label: string;
}

interface Props {
  ports?: PortMarker[];
  routes?: RouteSegment[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function MapView({
  ports = [],
  routes = [],
  center = [30, 0],
  zoom = 2,
  className = 'h-96',
}: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className={`rounded-lg ${className}`} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {ports.map((port) => (
        <Marker key={port.id} position={[port.latitude, port.longitude]}>
          <Popup>
            <strong>{port.name}</strong>
            <br />
            {port.is_eu_eea ? '🇪🇺 EU/EEA' : 'Non-EU'}
          </Popup>
        </Marker>
      ))}
      {routes.map((route, i) => (
        <Polyline key={i} positions={route.points} color={route.color} weight={3} opacity={0.8} />
      ))}
    </MapContainer>
  );
}
