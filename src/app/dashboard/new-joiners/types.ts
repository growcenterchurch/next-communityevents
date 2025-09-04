export type CoolNewJoiner = {
  id: number;
  name: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "OTHERS";
  gender: "male" | "female" | "other";
  yearOfBirth: number;
  phoneNumber: string;
  address: string;
  communityOfInterest:
    | "YOUTH"
    | "COLLEGE"
    | "PROFESSIONAL"
    | "NEWLYWED"
    | "UMUM";
  campusCode: string;
  campusName: string;
  location: string;
  createdAt: string | null;
  updatedBy: string;
  status: "pending" | "followed" | "completed";
};
