import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const donorIcon = L.divIcon({
  className: 'mealbridge-map-icon donor-map-icon',
  html: '<span>🍱</span>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
})

const recipientIcon = L.divIcon({
  className: 'mealbridge-map-icon recipient-map-icon',
  html: '<span>🏠</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

function FitMapBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [38, 38], maxZoom: 14 })
  }, [map, points])
  return null
}

export default function DonationMap({ donor, recipients, selectedRecipientId, compact = false }) {
  const donorPosition = useMemo(() => [donor.lat, donor.lng], [donor.lat, donor.lng])
  const selectedRecipient = recipients.find(recipient => recipient.id === selectedRecipientId) || recipients[0]
  const selectedPosition = selectedRecipient ? [selectedRecipient.lat, selectedRecipient.lng] : null
  const positions = useMemo(() => [donorPosition, ...recipients.map(recipient => [recipient.lat, recipient.lng])], [donorPosition, recipients])

  return <div className={`donation-map${compact ? ' compact' : ''}`}>
    <MapContainer center={donorPosition} zoom={13} scrollWheelZoom={!compact} className="donation-map-canvas">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapBounds points={positions} />
      <Marker position={donorPosition} icon={donorIcon}>
        <Popup><div className="map-popup"><strong>{donor.name}</strong><span>Food donor · {donor.location}</span><span>{donor.food} · {donor.qty} portions</span></div></Popup>
      </Marker>
      {recipients.map(recipient => <Marker key={recipient.id} position={[recipient.lat, recipient.lng]} icon={recipientIcon}>
        <Popup><div className="map-popup"><strong>{recipient.name}</strong><span>{recipient.type} · {recipient.distance} km away</span><span>{recipient.address}</span><span>{recipient.capacity} portion capacity · {recipient.successRate}% success</span></div></Popup>
      </Marker>)}
      {selectedPosition && <Polyline positions={[donorPosition, selectedPosition]} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.9, dashArray: '9 8' }} />}
    </MapContainer>
    <div className="map-key"><span><i className="map-key-donor" /> Donor</span><span><i className="map-key-recipient" /> Recipient</span></div>
    {!compact && selectedRecipient && <div className="map-route-summary"><span>Recommended route</span><strong>Sunrise Hostel <b>→</b> {selectedRecipient.name}</strong><small>{selectedRecipient.distance} km · {selectedRecipient.address}</small></div>}
  </div>
}
