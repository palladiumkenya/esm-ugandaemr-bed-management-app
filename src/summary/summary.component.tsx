import React from "react";
import { DataTableSkeleton } from "@carbon/react";
import { ArrowRight } from "@carbon/react/icons";
import { useTranslation } from "react-i18next";
import { ConfigurableLink, useConfig } from "@openmrs/esm-framework";
import {
  useAdmissionLocations,
  useMortuaryLocations,
} from "./summary.resource";
import EmptyState from "../empty-state/empty-state.component";
import WardCard from "../ward-card/ward-card.component";
import styles from "./summary.scss";
import { ErrorState } from "@openmrs/esm-patient-common-lib";
import { ConfigObject } from "../config-schema";

const Summary: React.FC = () => {
  const { t } = useTranslation();
  const { mortuaryLocationTagUuid } = useConfig<ConfigObject>();

  const {
    data: admissionLocations,
    isLoading: admissionLoading,
    error: admissionError,
  } = useAdmissionLocations();

  const {
    data: mortuaryLocations,
    isLoading: mortuaryLoading,
    error: mortuaryError,
  } = useMortuaryLocations(mortuaryLocationTagUuid);

  const isLoading = admissionLoading || mortuaryLoading;
  const error = admissionError || mortuaryError;

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <DataTableSkeleton role="progressbar" zebra />
      </div>
    );
  }

  const hasAdmissionData = admissionLocations?.length > 0;
  const hasMortuaryData = mortuaryLocations?.length > 0;
  const hasAnyData = hasAdmissionData || hasMortuaryData;

  if (hasAnyData) {
    return (
      <div className={styles.summaryContainer}>
        {hasAdmissionData && (
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionTitle}>
              {t("wardLocations", "Ward")}
            </h3>
            <div className={styles.cardContainer}>
              {admissionLocations.map((admissionLocation) => {
                const routeSegment = `${window.getOpenmrsSpaBase()}bed-management/location/${
                  admissionLocation.ward.uuid
                }`;

                return (
                  <WardCard
                    key={admissionLocation.ward.uuid}
                    headerLabel={admissionLocation.ward.display}
                    label={t("beds", "Beds")}
                    value={admissionLocation?.totalBeds}
                  >
                    {admissionLocation?.totalBeds && (
                      <div className={styles.link}>
                        <ConfigurableLink
                          className={styles.link}
                          to={routeSegment}
                        >
                          {t("viewBeds", "View beds")}
                        </ConfigurableLink>
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </WardCard>
                );
              })}
            </div>
          </div>
        )}

        {hasMortuaryData && (
          <div className={styles.sectionContainer}>
            <h3 className={styles.sectionTitle}>
              {t("mortuaryLocations", "Mortuary")}
            </h3>
            <div className={styles.cardContainer}>
              {mortuaryLocations.map((mortuaryLocation) => {
                const routeSegment = `${window.getOpenmrsSpaBase()}bed-management/mortuary-summary/${
                  mortuaryLocation.location.uuid
                }`;

                return (
                  <WardCard
                    key={mortuaryLocation.location.uuid}
                    headerLabel={mortuaryLocation.location.display}
                    label={t("compartments", "Compartments")}
                    value={mortuaryLocation?.totalCompartments || 0}
                  >
                    <div className={styles.link}>
                      <ConfigurableLink
                        className={styles.link}
                        to={routeSegment}
                      >
                        {t("viewCompartments", "View compartments")}
                      </ConfigurableLink>
                      <ArrowRight size={16} />
                    </div>
                  </WardCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!isLoading && !hasAnyData && !error) {
    return (
      <EmptyState
        msg={t("noDataToDisplay", "No data to display")}
        helper={t(
          "noLocationsConfigured",
          "No ward or mortuary locations have been configured"
        )}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        headerTitle={t(
          "errorFetchingLocationInformation",
          "Error fetching location information"
        )}
        error={error}
      />
    );
  }

  return null;
};

export default Summary;
