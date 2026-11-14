import {Component, Injectable, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// --- 1. ĐỊNH NGHĨA MODEL ---

export interface Metric {
  title: string;
  icon: string;
  iconClass: string;
  value: string;
  unit: string;
  subText: string;
  subIcon?: string;
  bgClass: string;
  headerClass: string;
}

export interface MicroTag {
  text: string;
  cssClass: string;
}

export interface TimelineStep {
  type: 'stage' | 'transition';

  // Dành cho 'stage' (Điểm dừng)
  stepNum?: string;
  tag?: string;
  tagClass?: string;
  time?: string;
  title?: string;
  address?: string;
  smartPillIcon?: string;
  smartPillText?: string;
  smartPillSub?: string;
  smartPillClass?: string;
  image?: string;
  imageBadgeIcon?: string;
  imageBadgeText?: string;
  imageBadgeClass?: string;
  priceRange?: string;
  description?: string;
  microTags?: MicroTag[];
  primaryAction?: string;

  // Dành cho 'transition' (Di chuyển)
  transitIcon?: string;
  distanceText?: string;
  routeDesc?: string;
  suggestIcon?: string;
  suggestText?: string;
  suggestClass?: string;
}

export interface AiNotice {
  icon: string;
  iconClass: string;
  title: string;
  titleClass: string;
  desc: string;
  bgClass: string;
  badgeText?: string;
  actionText?: string;
}

export interface ItineraryData {
  metrics: Metric[];
  timeline: TimelineStep[];
  aiNotices: AiNotice[];
}

interface ItineraryHistoryResponse {
  search_history: string[];
}

// --- 2. MOCK API SERVICE ---
@Injectable()
export class ItineraryApiService {
  constructor(private readonly http: HttpClient) {}

  getItinerary(payload?: any): Observable<ItineraryData> {
    const body = {
      search_history: payload?.search_history ?? ['Mì Quảng', 'Bún chả cá', 'Bánh tráng cuốn thịt heo'],
      city: payload?.city ?? 'Đà Nẵng',
      current_location: payload?.current_location ?? null,
      max_stops: payload?.max_stops ?? 4,
    };

    return this.http.post<ItineraryData>('http://localhost:8000/api/foods/itinerary/recommend', body);
  }
}

// --- 3. COMPONENT ---

@Component({
  selector: 'app-itinerary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itinerary.component.html',
  providers: [ItineraryApiService]
})
export class ItineraryComponent implements OnInit {

  isLoading = true;
  data!: ItineraryData;
  isPlayingAudio = false;

  constructor(
    private readonly api: ItineraryApiService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadItineraryFromHistory();
  }

  private loadItineraryFromHistory(): void {
    const fallbackHistory = ['Mì Quảng', 'Bún chả cá', 'Bánh tráng cuốn thịt heo', 'Hải sản'];
    const payloadBase = { city: 'Đà Nẵng', max_stops: 4 };

    this.http.get<ItineraryHistoryResponse>('http://localhost:8000/api/foods/search-history/for-itinerary')
      .subscribe({
        next: ({ search_history }) => {
          const requestPayload = {
            ...payloadBase,
            search_history: Array.isArray(search_history) && search_history.length > 0
              ? search_history
              : fallbackHistory,
          };
          this.requestItinerary(requestPayload);
        },
        error: () => {
          this.requestItinerary({ ...payloadBase, search_history: fallbackHistory });
        },
      });
  }

  private requestItinerary(payload: any): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.api.getItinerary({
            ...payload,
            current_location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              label: 'Vị trí hiện tại',
            },
          }).subscribe({
            next: (res) => {
              this.data = res;
              this.isLoading = false;
            },
            error: () => {
              this.loadFallback(payload);
            },
          });
        },
        () => {
          this.loadFallback(payload);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }

    this.loadFallback(payload);
  }

  private loadFallback(payload: any): void {
    this.api.getItinerary(payload).subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  // Giả lập phát audio
  playPhraseAudio(): void {
    if (this.isPlayingAudio) return;

    this.isPlayingAudio = true;

    try {
      const audioCtx = new (
        window.AudioContext ||
        (window as any).webkitAudioContext
      )();

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        880,
        audioCtx.currentTime + 0.3
      );

      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.3
      );

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);

    } catch (e) {
      console.error('Không thể phát audio:', e);
    }

    setTimeout(() => {
      this.isLoading = false;
      this.isPlayingAudio = false;
    }, 2500);
  }
}
