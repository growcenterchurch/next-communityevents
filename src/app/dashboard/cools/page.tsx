import communitiesData from "@/lib/datasets/cool_examples.json";
import { communityColumns } from "./columns";
import { CoolDataTable } from "./data-table";
import HeaderNav from "@/components/HeaderNav";

export default function CommunityDashboard() {
  const communities = communitiesData.data;

  return (
    <>
      {" "}
      <HeaderNav name="Dashboard" link=""></HeaderNav>
      <div className="container mx-auto py-10">
        <CoolDataTable columns={communityColumns} data={communities} />
      </div>
    </>
  );
}
