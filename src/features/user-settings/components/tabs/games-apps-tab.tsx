import React from 'react';
import {
  RegisteredGamesSubtab,
  ActivityPrivacySubtab,
  GameOverlaySubtab,
  ConnectedAppsSubtab,
} from './games-apps';

export interface GamesAppsTabProps {
  activeSection:
    | 'registered_games'
    | 'activity_privacy'
    | 'overlay'
    | 'connected_apps';
  currentUser?: any;
  currentUserName?: string;
  onNavigateSection?: (section: string) => void;
  colonies?: any[];
}

export function GamesAppsTab({
  activeSection,
  currentUserName,
  onNavigateSection,
  colonies,
}: GamesAppsTabProps) {
  switch (activeSection) {
    case 'registered_games':
      return (
        <RegisteredGamesSubtab onNavigateSection={onNavigateSection} />
      );
    case 'activity_privacy':
      return (
        <ActivityPrivacySubtab onNavigateSection={onNavigateSection} colonies={colonies} />
      );
    case 'overlay':
      return <GameOverlaySubtab />;
    case 'connected_apps':
      return <ConnectedAppsSubtab currentUserName={currentUserName} />;
    default:
      return null;
  }
}

export {
  RegisteredGamesSubtab,
  ActivityPrivacySubtab,
  GameOverlaySubtab,
  ConnectedAppsSubtab,
};
