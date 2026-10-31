export * from './components/colony-rail';
export * from './components/colony-icon';
export * from './components/create-or-join-colony-dialog';
export * from './components/edit-colony-dialog';
export * from './components/delete-colony-dialog';
export * from './components/colony-invite-dialog';
export * from './components/colonies-view';
export * from './hooks/use-colony-modals';
export * from './api/colonies-api';

// Backward compatibility aliases during transition
export { ColonyRail as ServerRail } from './components/colony-rail';
export { ColonyIcon as ServerIcon } from './components/colony-icon';
export { CreateOrJoinColonyDialog as CreateOrJoinServerDialog } from './components/create-or-join-colony-dialog';
export { EditColonyDialog as EditServerDialog } from './components/edit-colony-dialog';
export { DeleteColonyDialog as DeleteServerDialog } from './components/delete-colony-dialog';
export { ColonyInviteDialog as ServerInviteDialog } from './components/colony-invite-dialog';
export { ColoniesView as ServersView } from './components/colonies-view';
export { useColonyModals as useServerModals } from './hooks/use-colony-modals';
