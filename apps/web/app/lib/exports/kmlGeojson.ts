import type { Trip, GPSPoint } from '../utils/zod';

/**
 * Export trips to KML format (Google Earth)
 */
export function exportToKML(trips: Trip[], gpsPoints?: Record<string, GPSPoint[]>): string {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GovTrip Exports</name>
    <description>Government Trip Data</description>
    
    <!-- Styles -->
    <Style id="tripLine">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    
    <Style id="startPoint">
      <IconStyle>
        <color>ff00ff00</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="endPoint">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    ${trips.map(trip => generateTripKML(trip, gpsPoints?.[trip.id])).join('\n')}
  </Document>
</kml>`;

    return kml;
}

function generateTripKML(trip: Trip, gpsPoints?: GPSPoint[]): string {
    const dateStr = typeof trip.date === 'string' ? trip.date : trip.date.toISOString().split('T')[0];

    return `
    <Folder>
      <name>${trip.title}</name>
      <description>
        <![CDATA[
          <b>รหัสทริป:</b> ${trip.id}<br/>
          <b>วันที่:</b> ${dateStr}<br/>
          <b>ระยะทาง:</b> ${trip.distance} กม.<br/>
          <b>ต้นทุน:</b> ${trip.totalCost} บาท<br/>
          <b>สถานะ:</b> ${trip.status}
        ]]>
      </description>
      
      <!-- Start Point -->
      <Placemark>
        <name>เริ่มต้น: ${trip.startLocation}</name>
        <styleUrl>#startPoint</styleUrl>
        <Point>
          <coordinates>${trip.startCoords.lng},${trip.startCoords.lat},0</coordinates>
        </Point>
      </Placemark>
      
      <!-- End Point -->
      <Placemark>
        <name>จุดหมาย: ${trip.endLocation}</name>
        <styleUrl>#endPoint</styleUrl>
        <Point>
          <coordinates>${trip.endCoords.lng},${trip.endCoords.lat},0</coordinates>
        </Point>
      </Placemark>
      
      ${gpsPoints && gpsPoints.length > 0 ? `
      <!-- GPS Track -->
      <Placemark>
        <name>เส้นทาง ${trip.title}</name>
        <styleUrl>#tripLine</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            ${gpsPoints.map(p => `${p.lng},${p.lat},0`).join('\n            ')}
          </coordinates>
        </LineString>
      </Placemark>
      ` : `
      <!-- Direct Line (no GPS data) -->
      <Placemark>
        <name>เส้นตรง ${trip.title}</name>
        <styleUrl>#tripLine</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            ${trip.startCoords.lng},${trip.startCoords.lat},0
            ${trip.endCoords.lng},${trip.endCoords.lat},0
          </coordinates>
        </LineString>
      </Placemark>
      `}
    </Folder>
  `;
}

/**
 * Export trips to GeoJSON format
 */
export function exportToGeoJSON(trips: Trip[], gpsPoints?: Record<string, GPSPoint[]>): string {
    const features = trips.flatMap(trip => {
        const features: any[] = [];

        // Start point
        features.push({
            type: 'Feature',
            properties: {
                tripId: trip.id,
                title: trip.title,
                type: 'start',
                location: trip.startLocation,
                date: trip.date,
                status: trip.status,
            },
            geometry: {
                type: 'Point',
                coordinates: [trip.startCoords.lng, trip.startCoords.lat],
            },
        });

        // End point
        features.push({
            type: 'Feature',
            properties: {
                tripId: trip.id,
                title: trip.title,
                type: 'end',
                location: trip.endLocation,
                date: trip.date,
                status: trip.status,
            },
            geometry: {
                type: 'Point',
                coordinates: [trip.endCoords.lng, trip.endCoords.lat],
            },
        });

        // Route line
        const coordinates = gpsPoints && gpsPoints[trip.id] && gpsPoints[trip.id].length > 0
            ? gpsPoints[trip.id].map(p => [p.lng, p.lat])
            : [[trip.startCoords.lng, trip.startCoords.lat], [trip.endCoords.lng, trip.endCoords.lat]];

        features.push({
            type: 'Feature',
            properties: {
                tripId: trip.id,
                title: trip.title,
                type: 'route',
                distance: trip.distance,
                cost: trip.totalCost,
                status: trip.status,
                hasGPSData: gpsPoints && gpsPoints[trip.id] && gpsPoints[trip.id].length > 0,
            },
            geometry: {
                type: 'LineString',
                coordinates,
            },
        });

        return features;
    });

    const geoJSON = {
        type: 'FeatureCollection',
        features,
    };

    return JSON.stringify(geoJSON, null, 2);
}

/**
 * Download KML file
 */
export function downloadKML(kml: string, filename: string = 'trips-export.kml') {
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download GeoJSON file
 */
export function downloadGeoJSON(geojson: string, filename: string = 'trips-export.geojson') {
    const blob = new Blob([geojson], { type: 'application/geo+json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
