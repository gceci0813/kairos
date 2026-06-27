export class LocationTracker {
  private locationData: Map<string, LocationPoint[]> = new Map();
  
  addLocationPoint(deviceId: string, latitude: number, longitude: number, timestamp: number): void {
    if (!this.locationData.has(deviceId)) {
      this.locationData.set(deviceId, []);
    }
    
    this.locationData.get(deviceId)!.push({
      latitude,
      longitude,
      timestamp
    });
  }
  
  analyzeMovementPatterns(deviceId: string): MovementPattern | null {
    const points = this.locationData.get(deviceId);
    if (!points || points.length < 2) {
      return null;
    }
    
    // Sort by timestamp
    points.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate movement patterns
    return {
      totalDistance: this.calculateTotalDistance(points),
      averageSpeed: this.calculateAverageSpeed(points),
      frequentLocations: this.findFrequentLocations(points),
      activeHours: this.determineActiveHours(points)
    };
  }
  
  private calculateTotalDistance(points: LocationPoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      // Haversine formula for distance calculation
      const distance = this.haversineDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      
      totalDistance += distance;
    }
    
    return totalDistance;
  }
  
  private calculateAverageSpeed(points: LocationPoint[]): number {
    if (points.length < 2) return 0;
    
    const totalDistance = this.calculateTotalDistance(points);
    const timeSpan = points[points.length - 1].timestamp - points[0].timestamp;
    
    return timeSpan > 0 ? (totalDistance / timeSpan) * 3600 : 0; // km/h
  }
  
  private findFrequentLocations(points: LocationPoint[]): FrequentLocation[] {
    // Group points by proximity
    const locationGroups = this.groupByProximity(points, 0.01); // ~1km
    
    // Calculate frequency for each location
    return locationGroups.map(group => ({
      latitude: this.calculateCenter(group).latitude,
      longitude: this.calculateCenter(group).longitude,
      visitCount: group.length,
      averageStayDuration: this.calculateAverageStayDuration(group)
    }));
  }
  
  private determineActiveHours(points: LocationPoint[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    points.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    // Return hours with activity above threshold
    const threshold = Math.max(...hourCounts) * 0.3;
    return hourCounts
      .map((count, hour) => count > threshold ? hour : -1)
      .filter(hour => hour !== -1);
  }
  
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  private groupByProximity(points: LocationPoint[], threshold: number): LocationPoint[][] {
    // Simple clustering algorithm
    const groups: LocationPoint[][] = [];
    const assigned = new Set<number>();
    
    for (let i = 0; i < points.length; i++) {
      if (assigned.has(i)) continue;
      
      const group = [points[i]];
      assigned.add(i);
      
      for (let j = i + 1; j < points.length; j++) {
        if (assigned.has(j)) continue;
        
        const distance = this.haversineDistance(
          points[i].latitude, points[i].longitude,
          points[j].latitude, points[j].longitude
        );
        
        if (distance < threshold) {
          group.push(points[j]);
          assigned.add(j);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }
  
  private calculateCenter(points: LocationPoint[]): LocationPoint {
    const sumLat = points.reduce((sum, p) => sum + p.latitude, 0);
    const sumLon = points.reduce((sum, p) => sum + p.longitude, 0);
    
    return {
      latitude: sumLat / points.length,
      longitude: sumLon / points.length,
      timestamp: 0
    };
  }
  
  private calculateAverageStayDuration(group: LocationPoint[]): number {
    if (group.length < 2) return 0;
    
    const timeSpan = group[group.length - 1].timestamp - group[0].timestamp;
    return timeSpan / group.length;
  }
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface MovementPattern {
  totalDistance: number;
  averageSpeed: number;
  frequentLocations: FrequentLocation[];
  activeHours: number[];
}

interface FrequentLocation {
  latitude: number;
  longitude: number;
}