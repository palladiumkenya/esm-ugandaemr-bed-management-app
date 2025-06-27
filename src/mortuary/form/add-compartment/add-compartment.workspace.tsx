import React, { useEffect, useState } from "react";
import {
  type DefaultWorkspaceProps,
  ResponsiveWrapper,
  useLayoutType,
  useSession,
  showToast,
  showSnackbar,
  restBaseUrl,
  useConfig,
  launchWorkspace,
} from "@openmrs/esm-framework";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import styles from "./add-compartment.workspace.scss";
import {
  ButtonSet,
  Button,
  InlineLoading,
  TextInput,
  NumberInput,
  TextArea,
  Select,
  SelectItem,
  ComboBox
} from "@carbon/react";
import classNames from "classnames";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { type InitialData } from "../../../types";
import capitalize from "lodash-es/capitalize";
import {
  editBed,
  saveBed,
  useBedType,
} from "../../../bed-administration/bed-administration.resource";
import { useLocationsByTag } from "../../../summary/summary.resource";
import { ConfigObject } from "../../../config-schema";

type AddCompartmentWorkspaceProps = DefaultWorkspaceProps & {
  bed?: InitialData;
};

const numberInString = z.string().transform((val, ctx) => {
  const parsed = parseInt(val);
  if (isNaN(parsed) || parsed < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter a valid number",
    });
    return z.NEVER;
  }
  return val;
});

const compartmentFormSchema = z.object({
  bedId: z
    .string()
    .min(5, "Bed ID must be at least 5 characters")
    .max(255, "Bed ID must not exceed 255 characters"),
  description: z
    .string()
    .max(255, "Description must not exceed 255 characters"),
  CompartmentRow: numberInString,
  CompartmentColumn: numberInString,
  location: z
    .object({ display: z.string(), uuid: z.string() })
    .refine((value) => value.display !== "", "Please select a valid location"),
  occupancyStatus: z
    .string()
    .refine((value) => value !== "", "Please select a valid occupancy status"),
  bedType: z
    .string()
    .refine((value) => value !== "", "Please select a valid bed type"),
});

type CompartmentFormType = z.infer<typeof compartmentFormSchema>;

const AddCompartmentWorkspace: React.FC<AddCompartmentWorkspaceProps> = ({
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
  bed,
}) => {
  const { t } = useTranslation();
  const session = useSession();
  const locationUuid = session?.sessionLocation?.uuid;
  const isTablet = useLayoutType() === "tablet";
  const { mortuaryLocationTagUuid } = useConfig<ConfigObject>();
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  const { data: admissionLocations, isLoading: locationsLoading } =
    useLocationsByTag(mortuaryLocationTagUuid);
    console.log("admissionLocations", admissionLocations);
  const { bedTypes } = useBedType();

  const occupancyStatuses = ["Available", "Occupied"];
  const availableBedTypes = bedTypes ? bedTypes : [];
  const allLocations = admissionLocations || [];
  const hasLocations = allLocations.length > 0;

  const sessionLocation = allLocations.find((loc) => loc.uuid === locationUuid);

  const defaultValues = bed
    ? {
        bedId: bed.bedNumber,
        description: bed.description || "",
        CompartmentRow: bed.row?.toString() || "1",
        CompartmentColumn: bed.column?.toString() || "1",
        location: bed.location || { display: "", uuid: "" },
        occupancyStatus: capitalize(bed.status) || "Available",
        bedType: bed.bedType?.name || "",
      }
    : {
        bedId: "",
        description: "",
        CompartmentRow: "1",
        CompartmentColumn: "1",
        location: sessionLocation || { display: "", uuid: "" },
        occupancyStatus: "Available",
        bedType: "",
      };

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<CompartmentFormType>({
    resolver: zodResolver(compartmentFormSchema),
    defaultValues: defaultValues,
  });

  const filterLocationNames = (location) => {
    return (
      location.item.display
        ?.toLowerCase()
        .includes(location?.inputValue?.toLowerCase()) ?? []
    );
  };

  const onSubmit = async (data: CompartmentFormType) => {
    const bedPayload = {
      ...(bed?.uuid && { uuid: bed.uuid }),
      bedNumber: data.bedId,
      bedType: data.bedType,
      description: data.description,
      status: data.occupancyStatus.toUpperCase(),
      row: parseInt(data.CompartmentRow.toString()),
      column: parseInt(data.CompartmentColumn.toString()),
      locationUuid: data.location.uuid,
    };

    try {
      let response;

      if (bed?.uuid) {
        response = await editBed({
          bedPayload,
          bedId: bed.uuid,
        });
      } else {
        response = await saveBed({ bedPayload });
      }

      if (response.status === 201 || response.status === 200) {
        showSnackbar({
          title: t("success", "Success"),
          kind: "success",
          subtitle: bed?.uuid
            ? t("compartmentUpdated", "Compartment updated successfully")
            : t("compartmentCreated", "Compartment created successfully"),
        });
      }

      ["/location", "/bed"].forEach((endpoint) => {
             mutate(
               (key) => typeof key === "string" && key.includes(endpoint),
               undefined,
               { revalidate: true }
             );
           });
     

      closeWorkspaceWithSavedChanges();
    } catch (error: any) {
      showSnackbar({
        title: t("error", "Error"),
        kind: "error",
        subtitle: error?.message ?? t("bedSaveError", "Error saving bed"),
      });
    }
  };
  const handleError = (err) => {
    showToast({
      title: t("error", "Error"),
      kind: "error",
      description: t("formError", "Please check the form for errors"),
    });
  };

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  useEffect(() => {
    if (!locationsLoading && !hasLocations) {
      setShowLocationSetup(true);
    }
  }, [locationsLoading, hasLocations]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, handleError)}
      className={styles.form}
    >
      <div className={styles.formContainer}>
        <ResponsiveWrapper>
          <Controller
            control={control}
            name="bedId"
            render={({ field }) => (
              <TextInput
                id="bedId"
                placeholder={t("compartmentIdPlaceholder", "e.g. CHA-201")}
                labelText={t("compartmentId", "Compartment Number")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.bedId?.message}
                invalidText={errors.bedId?.message}
              />
            )}
          />
        </ResponsiveWrapper>

        <ResponsiveWrapper>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <TextArea
                id="description"
                placeholder={t(
                  "descriptionPlaceholder",
                  "Enter bed description"
                )}
                labelText={t("description", "Description")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.description?.message}
                invalidText={errors.description?.message}
                rows={3}
              />
            )}
          />
        </ResponsiveWrapper>

        <div className={styles.rowContainer}>
          <ResponsiveWrapper>
            <Controller
              control={control}
              name="CompartmentRow"
              render={({ field }) => (
                <NumberInput
                  id="CompartmentRow"
                  label={t("CompartmentRow", "Compartment Row")}
                  hideSteppers
                  value={field.value}
                  onChange={(e, { value }) => field.onChange(value.toString())}
                  invalid={!!errors.CompartmentRow?.message}
                  invalidText={errors.CompartmentRow?.message}
                />
              )}
            />
          </ResponsiveWrapper>
        </div>
        <div className={styles.rowContainer}>
          <ResponsiveWrapper>
            <Controller
              control={control}
              name="CompartmentColumn"
              render={({ field }) => (
                <NumberInput
                  id="CompartmentColumn"
                  label={t("CompartmentColumn", "Compartment Column")}
                  hideSteppers
                  value={field.value}
                  onChange={(e, { value }) => field.onChange(value.toString())}
                  invalid={!!errors.CompartmentColumn?.message}
                  invalidText={errors.CompartmentColumn?.message}
                />
              )}
            />
          </ResponsiveWrapper>
        </div>

        <ResponsiveWrapper>
          <div className={styles.locationFieldContainer}>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <ComboBox
                  id="location"
                  titleText={t("location", "Location")}
                  placeholder={
                    hasLocations
                      ? t("selectLocation", "Select a location")
                      : t("noLocationsAvailable", "No locations available")
                  }
                  items={allLocations}
                  itemToString={(location) => location?.display ?? ""}
                  shouldFilterItem={filterLocationNames}
                  selectedItem={value}
                  onChange={({ selectedItem }) => onChange(selectedItem)}
                  onBlur={onBlur}
                  ref={ref}
                  invalid={!!errors.location?.message}
                  invalidText={errors.location?.message}
                  disabled={!hasLocations}
                />
              )}
            />
          </div>
        </ResponsiveWrapper>

        <ResponsiveWrapper>
          <Controller
            control={control}
            name="occupancyStatus"
            render={({ field }) => (
              <Select
                id="occupancyStatus"
                labelText={t("occupancyStatus", "Occupancy Status")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.occupancyStatus?.message}
                invalidText={errors.occupancyStatus?.message}
              >
                <SelectItem
                  text={t("selectOccupancyStatus", "Select occupancy status")}
                  value=""
                />
                {occupancyStatuses.map((status, index) => (
                  <SelectItem
                    key={`occupancy-${index}`}
                    text={t(status.toLowerCase(), status)}
                    value={status}
                  />
                ))}
              </Select>
            )}
          />
        </ResponsiveWrapper>

        <ResponsiveWrapper>
          <Controller
            control={control}
            name="bedType"
            render={({ field }) => (
              <Select
                id="bedType"
                labelText={t("bedType", "Bed Type")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.bedType?.message}
                invalidText={errors.bedType?.message}
              >
                <SelectItem
                  text={t("selectBedType", "Select bed type")}
                  value=""
                />
                {availableBedTypes.map((bedType, index) => (
                  <SelectItem
                    key={`bedType-${index}`}
                    text={bedType.name}
                    value={bedType.name}
                  />
                ))}
              </Select>
            )}
          />
        </ResponsiveWrapper>
      </div>

      <ButtonSet
        className={classNames({
          [styles.tablet]: isTablet,
          [styles.desktop]: !isTablet,
        })}
      >
        <Button
          style={{ maxWidth: "50%" }}
          kind="secondary"
          onClick={() => closeWorkspace()}
        >
          {t("cancel", "Cancel")}
        </Button>
        <Button
          disabled={isSubmitting || !isDirty || !hasLocations}
          style={{ maxWidth: "50%" }}
          kind="primary"
          type="submit"
        >
          {isSubmitting ? (
            <span style={{ display: "flex", justifyItems: "center" }}>
              {t("submitting", "Submitting...")}{" "}
              <InlineLoading status="active" iconDescription="Loading" />
            </span>
          ) : (
            t("saveAndClose", "Save & close")
          )}
        </Button>
      </ButtonSet>
    </form>
  );
};

export default AddCompartmentWorkspace;
