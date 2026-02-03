import { defineWcButton } from './components/button.js';
import { defineWcDialog } from './components/dialog.js';
import { defineWcTabs } from './components/tabs.js';
import { defineWcAccordion } from './components/accordion.js';
import { defineWcSelect } from './components/select.js';

export { WcButton } from './components/button.js';
export {
  WcDialog,
  WcDialogTrigger,
  WcDialogClose,
} from './components/dialog.js';
export { WcTabs } from './components/tabs.js';
export { WcAccordion, WcAccordionItem, WcAccordionTrigger } from './components/accordion.js';
export { WcSelect, WcOption } from './components/select.js';

export function registerAll() {
  defineWcButton();
  defineWcDialog();
  defineWcTabs();
  defineWcAccordion();
  defineWcSelect();
}

export {
  defineWcButton,
  defineWcDialog,
  defineWcTabs,
  defineWcAccordion,
  defineWcSelect,
};
