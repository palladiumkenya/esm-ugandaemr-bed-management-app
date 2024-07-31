import {
  getAsyncLifecycle,
  defineConfigSchema,
  getSyncLifecycle,
} from "@openmrs/esm-framework";
import { configSchema } from "./config-schema";
import { createLeftPanelLink } from "./left-panel-link.component";
import { createDashboardLink } from "./bed-admission/createDashboardLink";
import { createDashboardLink as commonLibCreateDashboardLink } from "@openmrs/esm-patient-common-lib";
import InPatient from "./in-patient/in-patient.component";

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
const dashboradMeta = {
  slot: "patient-chart-in-patient-dashboard-slot",
  path: "in-patient",
  title: "In-Patient",
  moduleName: "@kenyaemr/esm-bed-management-app",
};

export const inPatientChartLink = getSyncLifecycle(
  commonLibCreateDashboardLink({ ...dashboradMeta }),
  options
);

export const inPatientChartDashboard = getSyncLifecycle(InPatient, options);
