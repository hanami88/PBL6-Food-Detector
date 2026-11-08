import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-external-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './external-restaurant-detail.component.html',
})
export class ExternalRestaurantDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  name = 'Quán ăn chưa có tên';
  address = 'Chưa có thông tin địa chỉ';
  openingHours = '';
  latitude: number | null = null;
  longitude: number | null = null;
  googleMapsSearchUrl = '';
  googleMapsDirectionsUrl = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.name = params.get('name') || this.name;
    this.address = params.get('address') || this.address;
    this.openingHours = params.get('openingHours') || '';
    this.latitude = this.parseCoordinate(params.get('latitude'), -90, 90);
    this.longitude = this.parseCoordinate(params.get('longitude'), -180, 180);

    const destination = this.latitude !== null && this.longitude !== null
      ? `${this.latitude},${this.longitude}`
      : `${this.name}, ${this.address}`;
    this.googleMapsSearchUrl = this.buildGoogleMapsUrl('search', `${this.name}, ${this.address}`);
    this.googleMapsDirectionsUrl = this.buildGoogleMapsUrl('dir', destination);
  }

  private buildGoogleMapsUrl(action: 'search' | 'dir', query: string): string {
    const params = new URLSearchParams({ api: '1' });
    params.set(action === 'search' ? 'query' : 'destination', query);
    return `https://www.google.com/maps/${action}/?${params.toString()}`;
  }

  private parseCoordinate(
    value: string | null,
    minimum: number,
    maximum: number,
  ): number | null {
    if (value === null) return null;
    const coordinate = Number(value);
    return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
      ? coordinate
      : null;
  }
}
