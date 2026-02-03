import { defineWcButton } from './components/button.js';
import { defineWcDialog } from './components/dialog.js';
import { defineWcTabs } from './components/tabs.js';
import { defineWcAccordion } from './components/accordion.js';
import { defineWcSelect } from './components/select.js';
import { defineWcToast } from './components/toast.js';
import { defineWcSidepanel } from './components/sidepanel.js';
import { defineWcDropdown } from './components/dropdown.js';
import { defineWcTooltip } from './components/tooltip.js';
import { defineWcSwitch } from './components/switch.js';
import { defineWcProgress } from './components/progress.js';
import { defineWcSkeleton } from './components/skeleton.js';
import { defineWcBadge } from './components/badge.js';
import { defineWcAlert } from './components/alert.js';
import { defineWcAvatar } from './components/avatar.js';
import { defineWcSpinner } from './components/spinner.js';

export { WcButton } from './components/button.js';
export {
  WcDialog,
  WcDialogTrigger,
  WcDialogClose,
} from './components/dialog.js';
export { WcTabs } from './components/tabs.js';
export { WcAccordion, WcAccordionItem, WcAccordionTrigger } from './components/accordion.js';
export { WcSelect, WcOption } from './components/select.js';
export { WcToast, WcToastContainer } from './components/toast.js';
export { WcSidepanel } from './components/sidepanel.js';
export { WcDropdown } from './components/dropdown.js';
export { WcTooltip } from './components/tooltip.js';
export { WcSwitch } from './components/switch.js';
export { WcProgress } from './components/progress.js';
export { WcSkeleton } from './components/skeleton.js';
export { WcBadge } from './components/badge.js';
export { WcAlert } from './components/alert.js';
export { WcAvatar } from './components/avatar.js';
export { WcSpinner } from './components/spinner.js';

export function registerAll() {
  defineWcButton();
  defineWcDialog();
  defineWcTabs();
  defineWcAccordion();
  defineWcSelect();
  defineWcToast();
  defineWcSidepanel();
  defineWcDropdown();
  defineWcTooltip();
  defineWcSwitch();
  defineWcProgress();
  defineWcSkeleton();
  defineWcBadge();
  defineWcAlert();
  defineWcAvatar();
  defineWcSpinner();
}

export {
  defineWcButton,
  defineWcDialog,
  defineWcTabs,
  defineWcAccordion,
  defineWcSelect,
  defineWcToast,
  defineWcSidepanel,
  defineWcDropdown,
  defineWcTooltip,
  defineWcSwitch,
  defineWcProgress,
  defineWcSkeleton,
  defineWcBadge,
  defineWcAlert,
  defineWcAvatar,
  defineWcSpinner,
};
