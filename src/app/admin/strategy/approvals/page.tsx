export const dynamic = "force-dynamic";

import React from "react";
import PendingApprovalsClient from "./PendingApprovalsClient";
import { getApprovalWorkflows } from "./actions";

export default async function PendingApprovalsPage() {
  const result = await getApprovalWorkflows();
  const initialWorkflows = result.success ? result.data : [];

  return <PendingApprovalsClient initialWorkflows={initialWorkflows} />;
}
