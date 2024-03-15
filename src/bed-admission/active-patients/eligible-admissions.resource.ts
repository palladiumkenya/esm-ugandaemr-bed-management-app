import { useMemo } from "react";
import useSWR from "swr";
import { openmrsFetch, useConfig } from "@openmrs/esm-framework";

interface PatientAdmissionListResponse {
  idNumber: string;
  name: string;
  age: number;
  gender: string;
  visitType: string;
  visitStartTime: string;
  admissionEncounterUuid: string;
  patientUuid: string;
}

export function useEligibleAdmissions() {
  const { patientListForAdmissionUrl } = useConfig();
  const { data, error, isLoading } = useSWR<
    { data: Array<PatientAdmissionListResponse> },
    Error
  >(patientListForAdmissionUrl ?? null, openmrsFetch);

  const patientQueueEntries = useMemo(() => {
    const rawData = data?.data ?? [];

    return rawData.map((el) => ({
      ...el,
      visitStartTime: new Date(
        parseInt(el.visitStartTime[0]),
        parseInt(el.visitStartTime[1]),
        parseInt(el.visitStartTime[2]),
        parseInt(el.visitStartTime[3]),
        parseInt(el.visitStartTime[4])
      ).toUTCString(),
    }));
  }, [data?.data]);

  return {
    patientEntries: patientQueueEntries ? patientQueueEntries : [],
    isLoading,
    error,
  };
}
