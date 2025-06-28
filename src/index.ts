import {
  getAsyncLifecycle,
  defineConfigSchema,
  getSyncLifecycle,
  registerFeatureFlag,
  getFeatureFlag,
} from "@openmrs/esm-framework";
import { configSchema } from "./config-schema";
import { createLeftPanelLink } from "./left-panel-link.component";
import { createDashboardLink } from "./bed-admission/createDashboardLink";
import AddCompartmentWorkspace from "./mortuary/form/add-compartment/add-compartment.workspace";
import AddMortuaryLocationWorkspace from "./mortuary/form/add-mortuary-location/add-mortuary-location.workspace";

const moduleName = "@kenyaemr/esm-bed-management-app";

const options = {
  featureName: "bed-management",
  moduleName,
};

export const importTranslation = require.context(
  "../translations",
  false,
  /.json$/,
  "lazy"
);

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(
  () => import("./root.component"),
  options
);

export const bedAdmission = getAsyncLifecycle(
  () => import("./bed-admission/bed-admission.component"),
  options
);

export const adminCardLink = getAsyncLifecycle(
  () => import("./admin-card-link.component"),
  options
);

export const summaryLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "bed-management",
    title: "Summary",
  }),
  options
);

export const adminLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "administration",
    title: "Ward Allocation",
  }),
  options
);

// Mortuary
export const MortuaryAllocationLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "mortuary-administration",
    title: "Mortuary Allocation",
  }),
  options
);

export const addCompartmentWorkspace = getSyncLifecycle(
  AddCompartmentWorkspace,
  options
);

export const addMortuaryLocation =  getSyncLifecycle(
  AddMortuaryLocationWorkspace,
  options
);

export const wardLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "ward",
    title: "Wards",
  }),
  options
);

export const bedTypeLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "bed-type",
    title: "Bed Type",
  }),
  options
);
export const bedTagLeftPanelLink = getSyncLifecycle(
  createLeftPanelLink({
    name: "bed-tag",
    title: "Bed Tag",
  }),
  options
);
export const bedAdmissionDashboardLink = getSyncLifecycle(
  createDashboardLink({
    name: "bed-admission",
    title: "In Patient",
  }),
  options
);
