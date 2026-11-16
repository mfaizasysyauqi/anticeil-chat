export interface ConnectedPlatformItem {
  id: string;
  name: string;
  icon: string;
  bg: string;
  text: string;
}

export const availablePlatforms: ConnectedPlatformItem[] = [
  { id: 'riot', name: 'Riot Games', icon: '⚡', bg: 'bg-[#d93f2f]', text: 'text-white' },
  { id: 'battlenet', name: 'Battle.net', icon: '🌀', bg: 'bg-[#0074e0]', text: 'text-white' },
  { id: 'bluesky', name: 'Bluesky', icon: '🦋', bg: 'bg-[#1185fe]', text: 'text-white' },
  { id: 'bungie', name: 'Bungie.net', icon: '💠', bg: 'bg-[#18181b]', text: 'text-[#06b6d4]' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', bg: 'bg-[#003087]', text: 'text-white' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', bg: 'bg-[#ff4500]', text: 'text-white' },
  { id: 'steam', name: 'Steam', icon: '⚙️', bg: 'bg-[#171a21]', text: 'text-white' },
  { id: 'x', name: 'X', icon: '✖️', bg: 'bg-black', text: 'text-white' },
  { id: 'ebay', name: 'eBay', icon: '🛍️', bg: 'bg-[#e53238]', text: 'text-white' },
  { id: 'crunchyroll', name: 'Crunchyroll', icon: '🍥', bg: 'bg-[#f47521]', text: 'text-white' },
  { id: 'playstation', name: 'PlayStation Network', icon: '🎮', bg: 'bg-[#003791]', text: 'text-white' },
  { id: 'xbox', name: 'Xbox', icon: '❎', bg: 'bg-[#107c10]', text: 'text-white' },
  { id: 'epic', name: 'Epic Games', icon: '🛡️', bg: 'bg-[#2b2b2b]', text: 'text-white' },
  { id: 'facebook', name: 'Facebook', icon: '📘', bg: 'bg-[#1877f2]', text: 'text-white' },
  { id: 'github', name: 'GitHub', icon: '🐙', bg: 'bg-[#24292e]', text: 'text-white' },
  { id: 'roblox', name: 'Roblox', icon: '🟥', bg: 'bg-[#e2231a]', text: 'text-white' },
  { id: 'twitch', name: 'Twitch', icon: '👾', bg: 'bg-[#9146ff]', text: 'text-white' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', bg: 'bg-[#ff0000]', text: 'text-white' },
  { id: 'spotify', name: 'Spotify', icon: '🟢', bg: 'bg-[#1ed760]', text: 'text-black' },
];

export interface UserConnection {
  id: string;
  platformId: string;
  accountName: string;
  platformName: string;
  icon: string;
  displayOnProfile: boolean;
  displayStatus: boolean;
}

export interface AuthorizedApp {
  id: string;
  name: string;
  icon: string;
  desc: string;
  scopes: string[];
  permissions: string[];
  issuedAt: string;
}
