export type Leader = {
  type: "user";
  communityId: string;
  name: string;
};

export type CommunityData = {
  type: string;
  id: number;
  name: string;
  campusCode: string;
  campusName: string;
  leaders: {
    type: string;
    communityId: string;
    name: string;
  }[];
  status: "active" | "inactive" | string;
};

export interface CommunityResponse {
  data: CommunityData[];
}
