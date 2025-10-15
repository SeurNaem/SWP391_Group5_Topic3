import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for EV charging stations
const chargingStationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2874/2874097.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Component to handle map events and custom functionality
const MapController = ({ onMapClick, center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && zoom) {
            map.setView(center, zoom);
        }
    }, [map, center, zoom]);

    useEffect(() => {
        if (onMapClick) {
            map.on('click', onMapClick);
            return () => {
                map.off('click', onMapClick);
            };
        }
    }, [map, onMapClick]);

    return null;
};

const MapComponent = ({
    center = [10.8231, 106.6297], // Default to Ho Chi Minh City, Vietnam
    zoom = 13,
    height = '400px',
    width = '100%',
    markers = [],
    onMapClick,
    showCurrentLocation = true,
    className = '',
    style = {}
}) => {
    const mapRef = useRef(null);

    // Function to get user's current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (mapRef.current) {
                        mapRef.current.setView([latitude, longitude], zoom);
                    }
                },
                (error) => {
                    console.error('Error getting current location:', error);
                }
            );
        }
    };

    const mapStyle = {
        height,
        width,
        borderRadius: '8px',
        border: '1px solid #d9d9d9',
        ...style
    };

    return (
        <div className={`map-container ${className}`} style={{ position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={mapStyle}
                ref={mapRef}
                scrollWheelZoom={true}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                    onMapClick={onMapClick}
                    center={center}
                    zoom={zoom}
                />

                {/* Render markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={marker.id || index}
                        position={[marker.lat, marker.lng]}
                        icon={marker.type === 'charging-station' ? chargingStationIcon : undefined}
                    >
                        <Popup>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                    {marker.title || 'Location'}
                                </h4>
                                {marker.description && (
                                    <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>
                                        {marker.description}
                                    </p>
                                )}
                                {marker.address && (
                                    <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
                                        📍 {marker.address}
                                    </p>
                                )}
                                {marker.status && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>
                                        Status: <span style={{
                                            color: marker.status === 'Available' ? '#52c41a' : '#ff4d4f',
                                            fontWeight: 'bold'
                                        }}>
                                            {marker.status}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Current location button */}
            {showCurrentLocation && (
                <button
                    onClick={getCurrentLocation}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 1000,
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontSize: '16px'
                    }}
                    title="Get current location"
                >
                    📍
                </button>
            )}
        </div>
    );
};

export default MapComponent;
