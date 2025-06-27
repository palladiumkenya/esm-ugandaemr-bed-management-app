import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Dropdown,
  InlineLoading,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from "@carbon/react";
import { Add, Edit, Location } from "@carbon/react/icons";
import {
  isDesktop as desktopLayout,
  launchWorkspace,
  useConfig,
  useLayoutType,
  usePagination,
  WorkspaceContainer,
} from "@openmrs/esm-framework";
import { CardHeader, ErrorState } from "@openmrs/esm-patient-common-lib";
import styles from "./compartment-administration-table.scss";
import {
  findBedByLocation,
  useWards,
  useLocationsByTag,
} from "../../../summary/summary.resource";
import { ConfigObject } from "../../../config-schema";

const CompartmentAdministrationTable: React.FC = () => {
  const { t } = useTranslation();
  const headerTitle = t("mortuaryAllocation", "Mortuary Allocation");
  const layout = useLayoutType();
  const isTablet = layout === "tablet";
  const responsiveSize = isTablet ? "lg" : "sm";
  const isDesktop = desktopLayout(layout);
  const { mortuaryLocationTagUuid } = useConfig<ConfigObject>();

  const [wardsGroupedByLocations, setWardsGroupedByLocation] = useState<
    Array<Location>
  >([]);
  const [isBedDataLoading, setIsBedDataLoading] = useState(false);
  const [filterOption, setFilterOption] = useState("ALL");

  const { data: mortuaryLocations, isLoading: mortuaryLocationsLoading } =
    useLocationsByTag(mortuaryLocationTagUuid);

  const hasMortuaryLocations =
    mortuaryLocations && mortuaryLocations.length > 0;

  function CustomTag({ condition }: { condition: boolean }) {
    const { t } = useTranslation();

    if (condition) {
      return (
        <Tag type="green" size="md">
          {t("yes", "Yes")}
        </Tag>
      );
    }

    return (
      <Tag type="red" size="md">
        {t("no", "No")}
      </Tag>
    );
  }

  const handleBedStatusChange = ({ selectedItem }: { selectedItem: string }) =>
    setFilterOption(selectedItem.trim().toUpperCase());

  const bedsMappedToLocation = wardsGroupedByLocations?.length
    ? [].concat(...wardsGroupedByLocations)
    : [];


  const { data, isLoading, error, isValidating, mutate } = useWards(
    mortuaryLocationTagUuid
  );

  const [currentPageSize, setPageSize] = useState(10);
  const pageSizes = [10, 20, 30, 40, 50];
  const { results, currentPage, totalPages, goTo } = usePagination(
    filterOption === "ALL"
      ? bedsMappedToLocation
      : bedsMappedToLocation.filter((bed) => bed.status === filterOption) ?? [],
    currentPageSize
  );

  const handleAddCompartment = () => {
    if (!hasMortuaryLocations) {
      launchWorkspace("add-mortuary-location-workspace", {
        workspaceTitle: t("addMortuaryLocation", "Add Mortuary Location"),
      });
      return;
    }

    launchWorkspace("add-compartment-workspace", {
      workspaceTitle: t("addCompartment", "Add Compartment"),
    });
  };

  const handleAddMortuaryLocation = () => {
    launchWorkspace("add-mortuary-location-workspace", {
      workspaceTitle: t("addMortuaryLocation", "Add Mortuary Location"),
    });
  };

  useEffect(() => {
    if (!isLoading && data) {
      setIsBedDataLoading(true);
      const fetchData = async () => {
        const promises = data.data.results.map(async (ward) => {

          const bedLocations = await findBedByLocation(ward.uuid);

          if (bedLocations.data.results.length) {
            const bedsWithLocation = bedLocations.data.results.map((bed) => ({
              ...bed,
              location: ward,
            }));

            return bedsWithLocation;
          }
          return null;
        });

        const updatedWards = (await Promise.all(promises)).filter(Boolean);
        setWardsGroupedByLocation(updatedWards);
        setIsBedDataLoading(false);
      };
      fetchData().finally(() => setIsBedDataLoading(false));
    }
  }, [data, isLoading, wardsGroupedByLocations.length]);

  const tableHeaders = [
    {
      key: "bedNumber",
      header: t("compartmentId", "Compartment ID"),
    },
    {
      key: "location",
      header: t("location", "Location"),
    },
    {
      key: "occupancyStatus",
      header: t("occupancyStatus", "Occupied"),
    },
    {
      key: "allocationStatus",
      header: t("allocationStatus", "Allocated"),
    },
    {
      key: "actions",
      header: t("actions", "Actions"),
    },
  ];

  const tableRows = useMemo(() => {
    

    return results.map((compartment) => {

      return {
        id: compartment.uuid,
        bedNumber: compartment.bedNumber,
        location: compartment.location.display,
        occupancyStatus: (
          <CustomTag condition={compartment?.status === "OCCUPIED"} />
        ),
        allocationStatus: <CustomTag condition={compartment.location?.uuid} />,
        actions: (
          <>
            <Button
              enterDelayMs={300}
              renderIcon={Edit}
              onClick={() => {
                launchWorkspace("add-compartment-workspace", {
                  workspaceTitle: t("editCompartment", "Edit Compartment"),
                  bed: compartment,
                });
              }}
              kind={"ghost"}
              iconDescription={t("editBed", "Edit Bed")}
              hasIconOnly
              size={responsiveSize}
              tooltipAlignment="start"
            />
          </>
        ),
      };
    });
  }, [responsiveSize, results, t]);

  if (
    (isBedDataLoading || isLoading || mortuaryLocationsLoading) &&
    !wardsGroupedByLocations.length
  ) {
    return (
      <>
        <div className={styles.widgetCard}>
          <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className={styles.widgetCard}>
          <ErrorState error={error} headerTitle={headerTitle} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle}>
          <span className={styles.backgroundDataFetchingIndicator}>
            <span>{isValidating ? <InlineLoading /> : null}</span>
          </span>
          {results?.length || hasMortuaryLocations ? (
            <div className={styles.headerActions}>
              {results?.length ? (
                <div className={styles.filterContainer}>
                  <Dropdown
                    id="occupancyStatus"
                    initialSelectedItem={"All"}
                    label=""
                    titleText={
                      t(
                        "filterByOccupancyStatus",
                        "Filter by occupancy status"
                      ) + ":"
                    }
                    type="inline"
                    items={["All", "Available", "Occupied"]}
                    onChange={handleBedStatusChange}
                  />
                </div>
              ) : null}
              {hasMortuaryLocations && (
                <Button
                  kind="ghost"
                  renderIcon={(props) => <Add size={16} {...props} />}
                  onClick={handleAddCompartment}
                >
                  {t("addCompartment", "Add Compartment")}
                </Button>
              )}
              <Button
                kind="ghost"
                renderIcon={(props) => <Location size={16} {...props} />}
                onClick={handleAddMortuaryLocation}
              >
                {t("addMortuaryLocation", "Add Mortuary Location")}
              </Button>
            </div>
          ) : null}
        </CardHeader>

        <DataTable
          rows={tableRows}
          headers={tableHeaders}
          isSortable
          size={isTablet ? "lg" : "sm"}
          useZebraStyles
        >
          {({ rows, headers, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader key={header.key}>
                        {header.header?.content ?? header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.value?.content ?? cell.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 ? (
                <div className={styles.tileContainer}>
                  <Tile className={styles.tile}>
                    <div className={styles.tileContent}>
                      {!hasMortuaryLocations ? (
                        <>
                          <div className={styles.emptyStateIcon}>
                            <Location size={48} />
                          </div>
                          <p className={styles.content}>
                            {t(
                              "noMortuaryLocationFound",
                              "No mortuary location found"
                            )}
                          </p>
                          <p className={styles.helper}>
                            {t(
                              "setupMortuaryLocationFirst",
                              "Set up a mortuary location first, then add compartments"
                            )}
                          </p>
                          <div className={styles.emptyStateActions}>
                            <Button
                              kind="primary"
                              size="sm"
                              renderIcon={(props) => (
                                <Location size={16} {...props} />
                              )}
                              onClick={handleAddMortuaryLocation}
                            >
                              {t(
                                "setupMortuaryLocation",
                                "Set up Mortuary Location"
                              )}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className={styles.content}>
                            {t("noCompartments", "No compartments to display")}
                          </p>
                          <p className={styles.helper}>
                            {t(
                              "checkFiltersOrAdd",
                              "Check the filters above or add a new compartment"
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </Tile>
                </div>
              ) : null}

              {rows.length > 0 && (
                <Pagination
                  backwardText="Previous page"
                  forwardText="Next page"
                  page={currentPage}
                  pageNumberText="Page Number"
                  pageSize={currentPageSize}
                  pageSizes={pageSizes?.length > 0 ? pageSizes : [10]}
                  totalItems={bedsMappedToLocation.length ?? 0}
                  onChange={({ pageSize, page }) => {
                    if (pageSize !== currentPageSize) {
                      setPageSize(pageSize);
                    }
                    if (page !== currentPage) {
                      goTo(page);
                    }
                  }}
                />
              )}
            </TableContainer>
          )}
        </DataTable>
      </div>
      <WorkspaceContainer overlay contextKey="bed-management" />
    </>
  );
};

export default CompartmentAdministrationTable;
