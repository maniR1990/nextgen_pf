/** Accessible label for the modal close control */
export const MODAL_CLOSE_LABEL = 'Close';

/** Overlay stacking order — matches `--comp-modal-z-index` */
export const MODAL_Z_INDEX = 50;

/** Enter/exit animation duration (ms) — keep in sync with `_modal.scss` */
export const MODAL_ANIMATION_MS = 200;

/** Focusable elements cycled by the focus trap */
export const MODAL_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Storybook / demo copy */
export const MODAL_DEMO_TITLE = 'Confirm action';

export const MODAL_DEMO_BODY = 'Are you sure you want to continue? This action cannot be undone.';

export const MODAL_DEMO_DELETE_TITLE = 'Delete transaction';

export const MODAL_DEMO_DELETE_BODY = 'This will permanently remove the selected transaction.';
