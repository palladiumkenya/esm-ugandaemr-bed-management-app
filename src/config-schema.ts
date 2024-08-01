import { Type } from "@openmrs/esm-framework";
import { boolean } from "zod";

export const configSchema = {
  admissionLocationTagUuid: {
    _type: Type.UUID,
    _description:
      "UUID for the location tag of the `Admission Location`. Patients may only be admitted to inpatient care in a location with this tag",
    _default: "233de33e-2778-4f9a-a398-fa09da9daa14",
  },
  inpatientVisitUuid: {
    _type: Type.UUID,
    _description: "UUID for the inpatient visit",
    _default: "a73e2ac6-263b-47fc-99fc-e0f2c09fc914",
  },
  restrictWardAdministrationToLoginLocation: {
    _type: Type.Boolean,
    _description: "UUID for the inpatient visit",
    _default: false,
  },
  patientListForAdmissionUrl: {
    _type: Type.String,
    _description:
      "Endpoint for fetching list of patients eligible for ward admission",
    _default: "",
  },
  inPatientForms: {
    _type: Type.Array,
    _description: "List of forms that can be filled out for in-patients",
    _default: [
      {
        label: "Cardex Nursing Plan",
        uuid: "89891ea0-444f-48bf-98e6-f97e87607f7e",
      },
      {
        label: "IPD Procedure Form",
        uuid: "3853ed6d-dddd-4459-b441-25cd6a459ed4",
      },
      {
        label: "Newborn Unit Admission ",
        uuid: "e8110437-e3cc-4238-bfc1-414bdd4de6a4",
      },
      {
        label: "Partograph Form",
        uuid: "3791e5b7-2cdc-44fc-982b-a81135367c96",
      },
    ],
  },
};

export type BedManagementConfig = {
  admissionLocationTagUuid: string;
  inpatientVisitUuid: string;
  restrictWardAdministrationToLoginLocation: boolean;
  patientListForAdmissionUrl: string;
  inPatientForms: Array<{ label: string; uuid: string }>;
};
