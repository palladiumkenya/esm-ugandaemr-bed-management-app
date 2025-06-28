import React, { useEffect } from "react";
import {
  type DefaultWorkspaceProps,
  ResponsiveWrapper,
  useLayoutType,
  showToast,
  showSnackbar,
  useConfig,
} from "@openmrs/esm-framework";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import styles from "./add-mortuary-location.workspace.scss";
import {
  ButtonSet,
  Button,
  InlineLoading,
  TextInput,
  FormGroup,
  Stack,
  InlineNotification,
} from "@carbon/react";
import classNames from "classnames";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { type locationFormData } from "../../types";
import { extractErrorMessagesFromResponse } from "../../../summary/summary.resource";
import { useLocationTags } from "../../hooks/useLocationTags";
import { saveLocation } from "../../hooks/useLocation";
import { ComboBox } from "@carbon/react";
import { ConfigObject } from "../../../config-schema";

type AddMortuaryLocationWorkspaceProps = DefaultWorkspaceProps & {
  location?: locationFormData;
};

const mortuaryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(255, "Location name must be less than 255 characters"),
  tags: z.any().optional(),
});

type MortuaryFormType = z.infer<typeof mortuaryFormSchema>;

const AddMortuaryLocationWorkspace: React.FC<
  AddMortuaryLocationWorkspaceProps
> = ({
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
  location,
}) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === "tablet";

  const { locationTagList: Tags } = useLocationTags();
  const { mortuaryLocationTagUuid } = useConfig<ConfigObject>();

  const defaultMortuaryTag = Tags?.find(
    (tag) => tag.uuid === mortuaryLocationTagUuid
  );

  const mortuaryTags =
    Tags?.filter((tag) => tag.uuid === mortuaryLocationTagUuid) || [];
  const isMortuaryTagAvailable =
    !!defaultMortuaryTag && mortuaryTags.length > 0;

  const getDefaultTagValue = () => {
    if (location && Array.isArray(location.tags) && location.tags.length > 0) {
      return (
        Tags?.find((tag) => tag.uuid === location.tags[0]?.uuid) ||
        defaultMortuaryTag
      );
    }
    return defaultMortuaryTag;
  };

  const defaultValues: MortuaryFormType = {
    name: location?.name || "",
    tags: getDefaultTagValue(),
  };

  const {
    handleSubmit,
    control,
    getValues,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<MortuaryFormType>({
    resolver: zodResolver(mortuaryFormSchema),
    defaultValues: defaultValues,
  });

  const onSubmit = async (data: MortuaryFormType) => {
    const formDataFormSubmission = getValues();

    const locationTagsUuid = formDataFormSubmission?.tags?.uuid
      ? [formDataFormSubmission.tags.uuid]
      : [];

    const locationPayload = {
      name: formDataFormSubmission.name,
      tags: locationTagsUuid,
    };

    try {
      await saveLocation(locationPayload);

      showSnackbar({
        title: t("success", "Success"),
        kind: "success",
        subtitle: location
          ? t(
              "locationUpdated",
              "Location {{locationName}} was updated successfully.",
              {
                locationName: data.name,
              }
            )
          : t(
              "locationCreated",
              "Location {{locationName}} was created successfully.",
              {
                locationName: data.name,
              }
            ),
      });

      ["/location", "/bed"].forEach((endpoint) => {
        mutate(
          (key) => typeof key === "string" && key.includes(endpoint),
          undefined,
          { revalidate: true }
        );
      });

      closeWorkspaceWithSavedChanges();
    } catch (error: any) {
      const errorMessages = extractErrorMessagesFromResponse(error);
      showSnackbar({
        title: t("error", "Error"),
        kind: "error",
        subtitle:
          errorMessages.join(", ") ||
          t("locationSaveError", "Error saving location"),
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit, handleError)}
      className={styles.form}
    >
      <div className={styles.formContainer}>
        <Stack gap={3}>
          <ResponsiveWrapper>
            <FormGroup legendText="">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextInput
                    id="locationName"
                    placeholder={t("locationPlaceholder", "Add a location")}
                    labelText={t("locationName", "Location Name")}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.name?.message}
                    invalidText={errors.name?.message}
                  />
                )}
              />
            </FormGroup>
          </ResponsiveWrapper>

          <ResponsiveWrapper>
            <FormGroup legendText="">
              {!isMortuaryTagAvailable && (
                <InlineNotification
                  kind="warning"
                  title={t("configurationRequired", "Configuration Required")}
                  subtitle={t(
                    "configureMortuaryTagMessage",
                    "Configure mortuary compartment tag to enable location tagging"
                  )}
                  lowContrast
                  hideCloseButton
                  style={{ marginBottom: "1rem" }}
                />
              )}
              <Controller
                control={control}
                name="tags"
                render={({ field: { onChange, value, ...restField } }) => (
                  <ComboBox
                    id="locationTags"
                    titleText={t("selectTags", "Select tag(s)")}
                    helperText={
                      isMortuaryTagAvailable
                        ? t(
                            "selectTagsHelper",
                            "Choose relevant tags for this location"
                          )
                        : t(
                            "tagsUnavailableHelper",
                            "Tags are unavailable until mortuary compartment tag is configured"
                          )
                    }
                    items={mortuaryTags}
                    selectedItem={value}
                    onChange={({ selectedItem }) => onChange(selectedItem)}
                    itemToString={(item) =>
                      item && typeof item === "object" ? item.display : ""
                    }
                    selectionFeedback="top-after-reopen"
                    invalid={!!errors.tags?.message}
                    invalidText={errors.tags?.message}
                    disabled={!isMortuaryTagAvailable}
                    {...restField}
                  />
                )}
              />
            </FormGroup>
          </ResponsiveWrapper>
        </Stack>
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
          disabled={isSubmitting || !isDirty}
          style={{ maxWidth: "50%" }}
          kind="primary"
          type="submit"
        >
          {isSubmitting ? (
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {t("submitting", "Submitting...")}
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

export default AddMortuaryLocationWorkspace;
