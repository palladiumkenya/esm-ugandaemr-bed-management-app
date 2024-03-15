import React, { useCallback, useState } from "react";
import classNames from "classnames";
import { Stack, ButtonSet, Button } from "@carbon/react";
import { useTranslation } from "react-i18next";
import {
  openmrsFetch,
  showNotification,
  showToast,
  useConfig,
  useLayoutType,
} from "@openmrs/esm-framework";
import styles from "./allocate-bed.scss";
import Overlay from "./overlay.component";
import { assignPatientBed } from "../bed-admission/bed-admission.resource";
import BedLayoutList from "../bed-admission/bed-layout/bed-layout-list.component";
import LocationComboBox from "../bed-admission/admitted-patients/location-combo-box.component";
import { Bed } from "../types";
import { mutate } from "swr";

interface WorkSpaceProps {
  closePanel: (e: boolean) => void;
  headerTitle?: string;
  queueStatus: string;
  patientDetails: {
    name: string;
    patientUuid: string;
    locationUuid: string;
    locationTo: string;
    locationFrom: string;
    queueUuid: string;
    encounter: string;
  };
}

const AllocateBedWorkSpace: React.FC<WorkSpaceProps> = ({
  headerTitle,
  closePanel,
  patientDetails,
  queueStatus,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === "tablet";
  const { restrictWardAdministrationToLoginLocation } = useConfig();

  const [selectedBed, setSelectedBed] = useState<Bed>();
  const [isBedAssigned, setIsBedAssigned] = useState(false);
  const [isQueueEnded, setIsQueueEnded] = useState(false);
  const [locationUuid, setLocation] = useState(
    restrictWardAdministrationToLoginLocation ? patientDetails.locationUuid : ""
  );

  const handleClick = (bed) => {
    setSelectedBed(bed);
  };

  const handleAssignBedToPatient = useCallback(() => {
    if (patientDetails.encounter === "") {
      showNotification({
        title: t("errorAssigningBed", "Error assigning bed"),
        kind: "error",
        critical: true,
        description: t(
          "admissionEncounterRequired",
          "This operation requires an admission encounter filled first"
        ),
      });
      return;
    }

    const patientAndEncounterUuids = {
      encounterUuid: patientDetails.encounter,
      patientUuid: patientDetails.patientUuid,
    };

    assignPatientBed(patientAndEncounterUuids, selectedBed.bedId)
      .then(() => {
        setIsBedAssigned(true);
        showToast({
          title: t("bedAssigned", "Bed Assigned"),
          kind: "success",
          critical: true,
          description: `Bed ${selectedBed.bedNumber} was assigned to ${patientDetails.name} successfully.`,
        });
        mutate(
          (key) =>
            typeof key === "string" &&
            key.startsWith(
              "rest/v1/kenyaemr/sql/?q=bedManagement.sqlGet.patientListForAdmission"
            )
        );

        closePanel(false);
      })
      .catch((error) => {
        showNotification({
          title: t("errorAssigningBed", "Error assigning bed"),
          kind: "error",
          critical: true,
          description: error?.message,
        });
      });
  }, [patientDetails, selectedBed, t, closePanel]);

  return (
    <>
      <Overlay header={headerTitle} closePanel={() => closePanel(false)}>
        <div className={styles.container}>
          <Stack gap={8} className={styles.container}>
            <section className={styles.section}>
              {restrictWardAdministrationToLoginLocation ? (
                <LocationComboBox setLocationUuid={setLocation} />
              ) : (
                <>
                  <LocationComboBox setLocationUuid={setLocation} />
                </>
              )}
              {patientDetails.encounter !== "" && (
                <BedLayoutList
                  locationUuid={locationUuid}
                  handleClick={handleClick}
                  patientDetails={patientDetails}
                />
              )}
              {patientDetails.encounter === "" && (
                <div className={styles.missingEncounter}>
                  {t(
                    "missingAdmissionEncounter",
                    "Clinical encounter for admission is required!"
                  )}
                </div>
              )}
            </section>
          </Stack>
        </div>
        {selectedBed && (
          <span className={styles.admitPatientInfo}>
            {" "}
            {t(
              "admittingPatientToBedText",
              `Click Save button to admit patient to Bed ${selectedBed.bedNumber}`
            )}
          </span>
        )}

        <ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
          <Button
            className={styles.button}
            kind="secondary"
            onClick={closePanel}
          >
            {t("discard", "Discard")}
          </Button>
          <Button
            onClick={handleAssignBedToPatient}
            className={classNames(styles.button, {
              [styles.disabled]: !patientDetails.encounter || !selectedBed,
            })}
            kind="primary"
            type="submit"
          >
            {t("save", "Save")}
          </Button>
        </ButtonSet>
      </Overlay>
    </>
  );
};

export default AllocateBedWorkSpace;
