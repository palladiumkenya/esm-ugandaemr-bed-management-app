export type Tag = {
  uuid: string;
  display: string;
  name: string;
  description?: string;
  retired: boolean;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
  resourceVersion: string;
};
export interface locationFormData {
  uuid?: string;
  name: string;
  tags: Tag;
}


export interface LocationTagsResponse {
  results: Tag[];
}
