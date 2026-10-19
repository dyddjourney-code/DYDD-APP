export type BaseCampProfile = {
  display_name: string;
  bio: string;
  fun_facts: string[];
  has_photo: boolean;
  revision: number;
};
export const emptyProfile: BaseCampProfile = {
  display_name: '', bio: '', fun_facts: [], has_photo: false, revision: 0,
};
