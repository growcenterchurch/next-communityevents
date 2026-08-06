import { API_BASE_URL, API_KEY } from "@/lib/config";

import type { CommunityOption } from "../types";

type UserResponse = {
  communityId: string;
  name: string;
};

type UsersResponse = {
  data?: UserResponse[];
};

function mapUserToOption(user: UserResponse): CommunityOption {
  return {
    id: user.communityId,
    name: user.name,
  };
}

export async function searchEventAccessUsers(
  query: string,
  accessToken: string
): Promise<CommunityOption[]> {
  const url = new URL(
    `${API_BASE_URL || "http://localhost:8080"}/api/v2/internal/users`
  );
  url.searchParams.set("search", query);
  url.searchParams.set("searchBy", "name");
  url.searchParams.set("limit", "5");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to search users.");
  }

  const data = (await response.json()) as UsersResponse;

  return (data.data ?? []).map(mapUserToOption);
}
