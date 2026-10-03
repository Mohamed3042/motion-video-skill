// The 31 MK Suite launcher concept screens (studio/public/mks/screens/<id>.jpg, stored at 2× = 3172×1984).
// All crop rects in the film are in 1× SOURCE pixels: 1586×992 (phones 992×1586).

export type ScreenId =
  | '01-library-studio' | '02-library-compact' | '03-library-focus' | '04-explore' | '05-app-detail'
  | '06-web-destination' | '07-activity' | '08-membership' | '09-membership-dialogs' | '10-license'
  | '11-settings' | '12-help' | '13-welcome' | '14-secret-office' | '15-destination-editor'
  | '16-command-search' | '17-empty-library' | '18-disconnected' | '19-launch-confirmation' | '20-job-error'
  | '21-website-entry' | '22-phone-library' | '23-phone-detail' | '24-phone-more' | '25-startup-recovery'
  | '26-restore-links' | '27-phone-connection' | '28-quit' | '29-trial-policy' | '30-library-menu' | '31-light-theme';

export const SCALE_STORED = 2; // stored files are 2× the source size
export const isPhone = (id: ScreenId) => id === '22-phone-library' || id === '23-phone-detail' || id === '24-phone-more';
export const srcSize = (id: ScreenId) => (isPhone(id) ? {w: 992, h: 1586} : {w: 1586, h: 992});
export const screenFile = (id: ScreenId) => `mks/screens/${id}.jpg`;

export const SCREEN_TITLE: Record<ScreenId, string> = {
  '01-library-studio': 'My library · Studio ("Your studio. A place for everything you make.")',
  '02-library-compact': 'My library · Compact (table with Purpose / Category Create·Work·Grow)',
  '03-library-focus': 'My library · Focus (Montage Pro hero, action cards, other apps)',
  '04-explore': 'Explore ("Find your next tool.", 3×3 product tiles, Create/Work/Grow chips)',
  '05-app-detail': 'App details · MK Editor (Artwork / Print checks / Approval handoff)',
  '06-web-destination': 'Web destination · MK Educate (phone card)',
  '07-activity': 'Activity (timeline + "Check before retrying" panel)',
  '08-membership': 'Membership · bundle builder ("Make it your suite.", Creator bundle)',
  '09-membership-dialogs': 'Membership · Review your selection dialog',
  '10-license': 'Licence activation (shows an error state — avoid)',
  '11-settings': 'Settings ("Make yourself at home.", theme Dark/Light/System, library view)',
  '12-help': 'Guide & FAQ ("What would you like to do?")',
  '13-welcome': 'First run ("Make room for your next idea.", floating product cubes)',
  '14-secret-office': 'Secret Office ("Your private desk.", MK Business OS hero, office tools)',
  '15-destination-editor': 'Add/edit destination',
  '16-command-search': 'Search overlay (Ctrl K, query "voice", MK Voice result)',
  '17-empty-library': 'Empty library',
  '18-disconnected': 'Companion unavailable (error state — avoid)',
  '19-launch-confirmation': 'Confirm app launch',
  '20-job-error': 'Installation failure (error state — avoid)',
  '21-website-entry': 'Website entry ("Your tools. One place." + Create / Work / Grow columns)',
  '22-phone-library': 'Phone · Library & Explore (portrait)',
  '23-phone-detail': 'Phone · App details (portrait)',
  '24-phone-more': 'Phone · More / Settings (portrait)',
  '25-startup-recovery': 'Startup / page recovery',
  '26-restore-links': 'Restore destinations · review',
  '27-phone-connection': 'Phone connection guide',
  '28-quit': 'Quit confirmation',
  '29-trial-policy': 'Membership · trial details',
  '30-library-menu': 'Library · organize pins',
  '31-light-theme': 'Settings · light theme',
};
