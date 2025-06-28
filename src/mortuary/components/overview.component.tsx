import React from "react";
import { useTranslation } from "react-i18next";
import { MortuaryHeader } from "./header/mortuary-header.component";
import CompartmentAdministrationTable from "../table/compartment/compartment-administration-table.component";
import styles from "./overview.scss";

export const OverviewComponent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <MortuaryHeader
        title={t("compartmentManagement", "Compartment Management")}
      />
      <div className={styles.flexContainer}>
        <CompartmentAdministrationTable />
      </div>
    </>
  );
};
