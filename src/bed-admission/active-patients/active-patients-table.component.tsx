import {
  DataTable,
  DataTableSkeleton,
  DefinitionTooltip,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Layer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
} from "@carbon/react";

import {
  isDesktop,
  useConfig,
  useLayoutType,
  usePagination,
  useSession,
} from "@openmrs/esm-framework";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOriginFromPathName } from "../helpers/functions";
import styles from "./styles.scss";
import EmptyState from "../../empty-state/empty-state.component";
import AssignBedWorkSpace from "../../workspace/allocate-bed-workspace.component";
import AdmissionActionButton from "./admission-action-button.component";
import { patientDetailsProps } from "../types";
import { useEligibleAdmissions } from "./eligible-admissions.resource";

interface ActiveVisitsTableProps {
  status: string;
  setPatientCount?: (value: number) => void;
}

const ActivePatientsTable: React.FC<ActiveVisitsTableProps> = ({
  status,
  setPatientCount,
}) => {
  const { t } = useTranslation();
  const session = useSession();
  const currentPathName: string = window.location.pathname;
  const fromPage: string = getOriginFromPathName(currentPathName);
  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] =
    useState<patientDetailsProps>();

  const layout = useLayoutType();

  const { restrictWardAdministrationToLoginLocation } = useConfig();

  const { patientEntries, isLoading } = useEligibleAdmissions();
  const handleBedAssigmentModal = useCallback(
    (entry) => {
      setSelectedPatientDetails({
        name: entry.name,
        patientUuid: entry.patientUuid,
        encounter: entry.admissionEncounterUuid,
        locationUuid: session?.sessionLocation?.uuid,
        locationTo: entry.locationTo,
        locationFrom: entry.locationFrom,
        queueUuid: entry.uuid,
      });
      setShowOverlay(true);
    },
    [session?.sessionLocation?.uuid]
  );

  const renderActionButton = useCallback(
    (entry) => {
      const buttonTexts = {
        pending: "Assign Bed",
        completed: "Transfer",
      };
      const buttonText = buttonTexts[status] || "Un-assign";

      return (
        <AdmissionActionButton
          entry={entry}
          handleBedAssigmentModal={handleBedAssigmentModal}
          buttonText={buttonText}
        />
      );
    },
    [handleBedAssigmentModal, status]
  );

  const {
    goTo,
    results: paginatedQueueEntries,
    currentPage,
  } = usePagination(patientEntries, currentPageSize);

  const tableHeaders = useMemo(
    () => [
      {
        id: 0,
        header: t("name", "Name"),
        key: "name",
      },
      {
        id: 1,
        header: t("idNumber", "Identifier"),
        key: "idNumber",
      },
      {
        id: 2,
        header: t("gender", "Gender"),
        key: "gender",
      },
      {
        id: 3,
        header: t("age", "Age"),
        key: "age",
      },
      {
        id: 4,
        header: t("visitType", "Visit type"),
        key: "visitType",
      },
      {
        id: 5,
        header: t("visitStartTime", "Visit start date/time"),
        key: "visitStartTime",
      },
      {
        id: 6,
        header: t("action", "Action"),
        key: "actions",
      },
    ],
    [t]
  );

  const tableRows = useMemo(() => {
    return paginatedQueueEntries?.map((entry) => ({
      id: `${entry.idNumber}`,
      ...entry,
      actions: {
        content: (
          <div className={styles.displayFlex}>{renderActionButton(entry)}</div>
        ),
      },
    }));
  }, [paginatedQueueEntries, renderActionButton]);

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }

  if (
    (!isLoading && patientEntries && status === "pending") ||
    status === "completed" ||
    status === ""
  ) {
    setPatientCount(patientEntries.length);
  }

  if (patientEntries?.length) {
    return (
      <div className={styles.container}>
        <div className={styles.headerBtnContainer}></div>

        <DataTable
          data-floating-menu-container
          headers={tableHeaders}
          overflowMenuOnHover={isDesktop(layout) ? true : false}
          rows={tableRows}
          isSortable
          size="xs"
          useZebraStyles
        >
          {({ rows, headers, getTableProps, getRowProps, onInputChange }) => (
            <TableContainer className={styles.tableContainer}>
              <TableToolbar
                style={{
                  position: "static",
                  height: "3rem",
                  overflow: "visible",
                  backgroundColor: "color",
                }}
              >
                <TableToolbarContent className={styles.toolbarContent}>
                  <Layer>
                    <TableToolbarSearch
                      className={styles.search}
                      onChange={onInputChange}
                      placeholder={t("searchThisList", "Search this list")}
                      size="sm"
                    />
                  </Layer>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()} className={styles.activeVisitsTable}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    {headers.map((header) => (
                      <TableHeader>
                        {header.header?.content ?? header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => {
                    return (
                      <>
                        <TableExpandRow {...getRowProps({ row })} key={row.id}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>
                              {cell.value?.content ?? cell.value}
                            </TableCell>
                          ))}
                        </TableExpandRow>

                        {row.isExpanded ? (
                          <TableExpandedRow
                            className={styles.expandedLabQueueVisitRow}
                            colSpan={headers.length + 2}
                          >
                            <>
                              {/* <span>{tableRows[index]?.comment ?? ""}</span> */}
                            </>
                          </TableExpandedRow>
                        ) : (
                          <TableExpandedRow
                            className={styles.hiddenRow}
                            colSpan={headers.length + 2}
                          />
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination
                forwardText="Next page"
                backwardText="Previous page"
                page={currentPage}
                pageSize={currentPageSize}
                pageSizes={pageSizes}
                totalItems={patientEntries?.length}
                className={styles.pagination}
                onChange={({ pageSize, page }) => {
                  if (pageSize !== currentPageSize) {
                    setPageSize(pageSize);
                  }
                  if (page !== currentPage) {
                    goTo(page);
                  }
                }}
              />
            </TableContainer>
          )}
        </DataTable>
        {showOverlay && (
          <AssignBedWorkSpace
            patientDetails={selectedPatientDetails}
            closePanel={() => setShowOverlay(false)}
            queueStatus={status}
            headerTitle={t(
              "assignBedToPatient",
              restrictWardAdministrationToLoginLocation === true
                ? `Assign Bed to Patient  ${selectedPatientDetails.name} in the ${session?.sessionLocation?.display} Ward`
                : `Assign Bed to Patient  ${selectedPatientDetails.name}`
            )}
          />
        )}
      </div>
    );
  }

  return (
    <EmptyState
      msg={t("noPatientForAdmission", "There are no patients for admission")}
      helper=""
    />
  );
};
export default ActivePatientsTable;
