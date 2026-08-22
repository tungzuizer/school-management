export const dynamic = "force-dynamic";

import React from "react";
import EvidencesClient from "./EvidencesClient";
import { getEvidenceFiles } from "./actions";

export default async function EvidenceManagementPage() {
  const result = await getEvidenceFiles({ includeDeleted: true });
  const initialFiles = result.success ? result.data : [];

  return <EvidencesClient initialFiles={initialFiles} />;
}
