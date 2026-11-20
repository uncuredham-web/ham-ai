export interface NewsPreference {
  userId: string;
  likedCategories: string[];
  dislikedCategories: string[];
  lastUpdated: string;
}

export const initialNewsConfig: NewsPreference = {
  userId: "ham_user_20261121",
  likedCategories: [],
  dislikedCategories: [],
  lastUpdated: "2026-11-21"
};
