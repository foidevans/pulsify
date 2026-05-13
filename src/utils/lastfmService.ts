import type {
  LastFmTrack,
  Track,
  Artist,
  GenreStat,
  RegionStat,
} from  '../types'
import { sanitizeString } from "./helpers";

const LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026"; 
const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0";


const FALLBACK_TRACKS = [
  {
    name: "Blinding Lights",
    artist: "The Weeknd",
    playcount: "2800000",
    listeners: "1200000",
  },
  {
    name: "One Dance",
    artist: "Drake ft. Wizkid, Kyla",
    playcount: "2500000",
    listeners: "980000",
  },
  {
    name: "Lover",
    artist: "Taylor Swift",
    playcount: "2100000",
    listeners: "870000",
  },
  {
    name: "After Dark",
    artist: "Mr.Kitty",
    playcount: "2000000",
    listeners: "760000",
  },
  {
    name: "Midnight City",
    artist: "M83",
    playcount: "1700000",
    listeners: "650000",
  },
  {
    name: "Sunroof",
    artist: "Nicky Youre",
    playcount: "1500000",
    listeners: "540000",
  },
  {
    name: "Heat Waves",
    artist: "Glass Animals",
    playcount: "1900000",
    listeners: "810000",
  },
  {
    name: "As It Was",
    artist: "Harry Styles",
    playcount: "2300000",
    listeners: "1100000",
  },
];

const ARTIST_COLORS = [
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#84cc16", // lime
];

const GENRES = [
  "Hip-Hop",
  "Pop",
  "R&B",
  "Electronic",
  "Indie",
  "Afrobeats",
  "House",
  "Soul",
];
const GENRE_COLORS = [
  "#00e676",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#ec4899",
];

const REGIONS: RegionStat[] = [
  {
    region: "North America",
    percentage: 38,
    streams: 1_081_297,
    color: "#00e676",
  },
  { region: "Europe", percentage: 27, streams: 769_028, color: "#a855f7" },
  {
    region: "Asia Pacific",
    percentage: 18,
    streams: 512_686,
    color: "#06b6d4",
  },
  {
    region: "Latin America",
    percentage: 12,
    streams: 341_790,
    color: "#ec4899",
  },
  { region: "Africa", percentage: 5, streams: 142_413, color: "#f59e0b" },
];

// ─── Fetch from Last.fm ───────────────────────────────────────────────────────

async function fetchLastFmTopTracks(): Promise<LastFmTrack[]> {
  const url = `${LASTFM_BASE}/?method=chart.gettoptracks&api_key=${LASTFM_API_KEY}&format=json&limit=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
  const json = await res.json();
  return json?.tracks?.track ?? [];
}

// ─── Transform Last.fm → internal Track type ─────────────────────────────────

function transformTrack(
  lfmTrack: LastFmTrack | (typeof FALLBACK_TRACKS)[0],
  index: number,
): Track {
  const streams =
    parseInt("playcount" in lfmTrack ? lfmTrack.playcount : "0", 10) ||
    Math.floor(Math.random() * 2_000_000 + 500_000);

  const name = sanitizeString("name" in lfmTrack ? lfmTrack.name : "");
  const artistName = sanitizeString(
    "artist" in lfmTrack
      ? typeof (lfmTrack as LastFmTrack).artist === "object"
        ? (lfmTrack as LastFmTrack).artist.name
        : String((lfmTrack as LastFmTrack).artist)
      : "",
  );

  return {
    id: `track-${index}`,
    name,
    artist: artistName,
    artistId: `artist-${index}`,
    streams,
    trend: parseFloat((Math.random() * 30 - 5).toFixed(1)),
    rank: index + 1,
    genre: GENRES[index % GENRES.length],
    duration: Math.floor(Math.random() * 120 + 180),
    imageUrl: undefined,
  };
}

function buildArtists(tracks: Track[]): Artist[] {
  // Dedupe artists, take top ones
  const seen = new Set<string>();
  const artists: Artist[] = [];

  tracks.forEach((track, i) => {
    const key = track.artist;
    if (!seen.has(key) && artists.length < 6) {
      seen.add(key);
      artists.push({
        id: track.artistId,
        name: track.artist,
        streams: track.streams,
        listeners: Math.floor(track.streams * (Math.random() * 0.4 + 0.3)),
        genre: track.genre,
        popularity: Math.floor(Math.random() * 30 + 65),
        reach: Math.floor(Math.random() * 30 + 55),
        engagement: Math.floor(Math.random() * 25 + 60),
        growth: Math.floor(Math.random() * 40 + 40),
        vitality: Math.floor(Math.random() * 30 + 55),
        color: ARTIST_COLORS[i % ARTIST_COLORS.length],
      });
    }
  });

  return artists;
}

function buildGenres(tracks: Track[]): GenreStat[] {
  return GENRES.slice(0, 5).map((genre, i) => ({
    genre,
    streams: Math.floor(Math.random() * 4000 + 1500),
    color: GENRE_COLORS[i],
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SeedData {
  tracks: Track[];
  artists: Artist[];
  genres: GenreStat[];
  regions: RegionStat[];
  totalStreams: number;
  activeListeners: number;
}

export async function fetchSeedData(): Promise<SeedData> {
  let rawTracks: Array<LastFmTrack | (typeof FALLBACK_TRACKS)[0]> = [];

  try {
    const lfmTracks = await fetchLastFmTopTracks();
    if (lfmTracks.length > 0) {
      rawTracks = lfmTracks.slice(0, 8);
      console.info("[Pulsify] Seeded from Last.fm ✓");
    } else {
      throw new Error("Empty response");
    }
  } catch (err) {
    console.warn(
      "[Pulsify] Last.fm unavailable, using fallback seed data",
      err,
    );
    rawTracks = FALLBACK_TRACKS;
  }

  const tracks = rawTracks.map(transformTrack);
  const artists = buildArtists(tracks);
  const genres = buildGenres(tracks);
  const totalStreams = tracks.reduce((sum, t) => sum + t.streams, 0);
  const activeListeners = Math.floor(totalStreams * 0.0045);

  return {
    tracks,
    artists,
    genres,
    regions: REGIONS,
    totalStreams,
    activeListeners,
  };
}
