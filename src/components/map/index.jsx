import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in React Leaflet - using CDN references
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for EV charging stations
const chargingStationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2874/2874097.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Custom marker icon for current location
const currentLocationIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
});

// Component to handle geolocation and current location marker
const LocationMarker = ({ onLocationFound }) => {
    const [position, setPosition] = useState(null);
    const map = useMap();

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newPosition = [latitude, longitude];
                    setPosition(newPosition);
                    if (onLocationFound) {
                        onLocationFound(newPosition);
                    }
                },
                (error) => {
                    console.warn("Location access denied or unavailable:", error.message);
                    // Fallback to default Ho Chi Minh City location
                    const fallbackPosition = [10.8231, 106.6297];
                    setPosition(fallbackPosition);
                    if (onLocationFound) {
                        onLocationFound(fallbackPosition);
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        } else {
            // Fallback if geolocation is not supported
            const fallbackPosition = [10.8231, 106.6297];
            setPosition(fallbackPosition);
            if (onLocationFound) {
                onLocationFound(fallbackPosition);
            }
        }
    }, [map, onLocationFound]);

    return position === null ? null : (
        <Marker position={position} icon={currentLocationIcon}>
            <Popup>
                <div style={{ textAlign: 'center' }}>
                    <strong>📍 Your Current Location</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </span>
                </div>
            </Popup>
        </Marker>
    );
};

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
    onLocationFound,
    className = '',
    style = {}
}) => {
    const mapRef = useRef(null);
    const [currentCenter, setCurrentCenter] = useState(center);
    const [currentZoom, setCurrentZoom] = useState(zoom);

    // Function to handle location found (without auto-centering)
    const handleLocationFound = (position) => {
        // Don't automatically center the map on user location
        if (onLocationFound) {
            onLocationFound(position);
        }
    };

    // Function to get user's current location and center map
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newPosition = [latitude, longitude];
                    setCurrentCenter(newPosition);
                    setCurrentZoom(15);
                    if (onLocationFound) {
                        onLocationFound(newPosition);
                    }
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    alert('Unable to get your current location. Please ensure location services are enabled.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
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
                center={currentCenter}
                zoom={currentZoom}
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
                    center={currentCenter}
                    zoom={currentZoom}
                />

                {/* Current location marker */}
                {showCurrentLocation && (
                    <LocationMarker onLocationFound={handleLocationFound} />
                )}

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
                                {marker.distanceText && (
                                    <p style={{ margin: '4px 0', fontSize: '11px', color: '#1890ff', fontWeight: 'bold' }}>
                                        📏 Distance: {marker.distanceText} away
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
            <button
                onClick={getCurrentLocation}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    background: 'white',
                    border: '2px solid #1890ff',
                    borderRadius: '6px',
                    padding: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    fontSize: '16px',
                    color: '#1890ff',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    minHeight: '40px'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = '#1890ff';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#1890ff';
                    e.target.style.transform = 'scale(1)';
                }}
                title="Center map on your current location"
            >
                🎯
            </button>
        </div>
    );
};

export default MapComponent;
