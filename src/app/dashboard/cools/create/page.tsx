import React from "react";
import HeaderNav from "@/components/HeaderNav";
import CreateCoolForm from "@/components/CreateCoolForm";
const CreateCoolPage = () => {
  return (
    <>
      <HeaderNav name="Create Cool" link="dashboard/cools"></HeaderNav>
      <CreateCoolForm></CreateCoolForm>
    </>
  );
};

export default CreateCoolPage;
