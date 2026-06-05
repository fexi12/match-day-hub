export type ClaimablePlayer = {
  name?: string;
  email?: string;
};

export const normalizeEmail = (email?: string | null) => (email ?? "").trim().toLowerCase();

export const isClaimedByUser = (player: ClaimablePlayer, userEmail?: string | null) => {
  const playerEmail = normalizeEmail(player.email);
  return !!playerEmail && playerEmail === normalizeEmail(userEmail);
};

export const canUserPlaceSelfInSlot = (player: ClaimablePlayer, userEmail?: string | null) => {
  if (!normalizeEmail(userEmail)) return false;
  if (isClaimedByUser(player, userEmail)) return true;
  return !normalizeEmail(player.email);
};

export const placeSelfButtonLabel = (player: ClaimablePlayer, userEmail?: string | null) => {
  if (isClaimedByUser(player, userEmail)) return "Remove me";
  if (canUserPlaceSelfInSlot(player, userEmail)) return "Place me here";
  return "Position taken";
};
