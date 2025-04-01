import { Type } from "@openmrs/esm-framework";
import { boolean } from "zod";

export const configSchema = {
  admissionLocationTagUuid: {
    _type: Type.UUID,
    _description:
      "UUID for the location tag of the `Admission Location`. Patients may only be admitted to inpatient care in a location with this tag",
    _default: "839c65c7-9998-4b90-b80b-39727dfe9fa2",
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
  morgueCompartmentTagUuid: {
    _type: Type.UUID,
    _description:
      "UUID for the location tag of the `morgue compartment`. Deceased patients may only be admitted to mortuary care in a location with this tag",
    _default: "0803aa41-ef5f-42e1-9c6d-8c762a54250c",
  },
};
