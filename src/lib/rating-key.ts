/** Normalizes a player name into the key used in player_ratings.player_key. */
export const normalizeRatingKey = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
