import { defineWcButton } from './components/button.js';
import { defineWcDialog } from './components/dialog.js';
import { defineWcTabs } from './components/tabs.js';
import { defineWcAccordion } from './components/accordion.js';
import { defineWcSelect } from './components/select.js';
import { defineWcToast } from './components/toast.js';
 import { defineWcSidepanel } from './components/sidepanel.js';

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

export function registerAll() {
  defineWcButton();
  defineWcDialog();
  defineWcTabs();
  defineWcAccordion();
  defineWcSelect();
  defineWcToast();
  defineWcSidepanel();
}

export {
  defineWcButton,
  defineWcDialog,
  defineWcTabs,
  defineWcAccordion,
  defineWcSelect,
  defineWcToast,
  defineWcSidepanel,
};
